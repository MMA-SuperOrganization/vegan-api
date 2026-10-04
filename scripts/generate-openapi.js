import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import yaml from "yaml";
import prettier from "prettier";
import { createContractRegistry, ref } from "../src/contracts/registry.js";
import { readSourceEndpoints } from "../src/contracts/source-spec.js";
import {
  annotateSchemas,
  moduleNotes,
  fieldDescription,
  schemaExample,
  requestExamples,
  operationDescription,
  requestIdHeader,
  errorExample,
} from "./openapi-details.js";

export const openApiPath = (path) => path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
const jsonContent = (schema) => ({ "application/json": { schema } });

export function generateOpenApi(registry = createContractRegistry()) {
  const baseline = new Map(
    readSourceEndpoints().map((route) => [`${route.method} ${route.path}`, route]),
  );
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "Vegan Support API (MMA302)",
      version: "0.1.0",
      description:
        "Tài liệu 184 API backend, sinh từ route registry và Zod validator.\n\nĐăng nhập bằng Firebase client SDK, lấy ID token, bấm Authorize và nhập token (không thêm chữ Bearer trong ô Swagger). Gọi POST /auth/sync trước API cá nhân. Optional auth cho phép guest nhưng từ chối token đã gửi mà không hợp lệ.\n\nRequest có body dùng Content-Type: application/json. Response thành công: {success:true,data,meta}; lỗi: {success:false,error:{code,message,details},meta}. X-Request-Id dùng đối chiếu log. Query page bắt đầu từ 1, giới hạn/default xem từng schema. ObjectId gồm 24 ký tự hexadecimal; ID bữa ăn là UUID. Ngày lịch YYYY-MM-DD, timestamp ISO 8601 có timezone offset, timezone là tên IANA.\n\nVí dụ là dữ liệu tổng hợp để minh họa schema, không phải bản ghi seed hoặc cam kết giá trị nghiệp vụ. Thay ID, token, URL và ngày bằng dữ liệu thực tế có quyền truy cập; không thực thi thao tác ghi chỉ để thử ví dụ trên production. Ràng buộc kiểm tra chéo và điều kiện service được giải thích trong từng operation; JSON Schema không thể biểu diễn đầy đủ mọi điều kiện nghiệp vụ.",
    },
    servers: [
      { url: "/api/v1", description: "Cùng origin với Swagger UI; API prefix mặc định" },
      {
        url: "{baseUrl}{apiPrefix}",
        description: "Môi trường khác/custom API prefix",
        variables: {
          baseUrl: {
            default: "http://localhost:3000",
            description: "Origin backend, không có dấu / cuối",
          },
          apiPrefix: {
            default: "/api/v1",
            description: "API_PREFIX cấu hình ở backend, có dấu / đầu",
          },
        },
      },
    ],
    tags: [...new Set(registry.operations.map((route) => route.module))]
      .sort()
      .map((name) => ({ name, description: moduleNotes[name] })),
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Firebase ID Token",
          description:
            "Firebase ID token từ client SDK. Swagger tự thêm Bearer; không dùng custom token/refresh token/FCM token.",
        },
      },
      schemas: annotateSchemas(registry.schemas),
    },
  };
  for (const route of registry.operations) {
    const path = openApiPath(route.path);
    const parameters = [];
    for (const location of ["params", "query"]) {
      if (!route.request[location]) continue;
      const schema = registry.schemas[route.request[location]];
      if (schema.type !== "object")
        throw new Error(`Expected object ${route.operationId}.${location}`);
      for (const [name, property] of Object.entries(schema.properties)) {
        parameters.push({
          name,
          in: location === "params" ? "path" : "query",
          required: location === "params" || (schema.required ?? []).includes(name),
          description: fieldDescription(name, property),
          schema: property,
          ...(property.type === "array" ? { style: "form", explode: true } : {}),
          // Preprocessed CSV query schemas have no expressible wire type. Do not
          // invent an example that bypasses the actual validator.
          ...(property.type || property.anyOf || property.oneOf || property.enum
            ? { example: schemaExample(property, registry.schemas, name) }
            : {}),
        });
      }
    }
    const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
    const params = parameters
      .filter((parameter) => parameter.in === "path")
      .map((parameter) => parameter.name)
      .sort();
    if (JSON.stringify(placeholders) !== JSON.stringify(params))
      throw new Error(`Path validation mismatch: ${route.operationId}`);
    const responses = {
      [route.status]: {
        description: route.status === 201 ? "Created" : "Success",
        content: jsonContent(ref(route.response)),
      },
      400: {
        description: "Invalid request / business validation",
        content: jsonContent(ref("ErrorEnvelope")),
      },
      404: {
        description: "Resource not found or unavailable to this actor",
        content: jsonContent(ref("ErrorEnvelope")),
      },
      429: { description: "Request rate exceeded", content: jsonContent(ref("ErrorEnvelope")) },
      500: {
        description: "Sanitized internal server error",
        content: jsonContent(ref("ErrorEnvelope")),
      },
    };
    if (route.auth !== "public") {
      responses[401] = {
        description: "Missing, expired or invalid Firebase token",
        content: jsonContent(ref("ErrorEnvelope")),
      };
      responses[403] = {
        description: "Inactive account, insufficient role or non-owner",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    }
    if (!["GET"].includes(route.method))
      responses[409] = {
        description: "Duplicate, invalid state or concurrent update conflict",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    if (route.request.body)
      responses[413] = {
        description: "Request exceeds JSON body limit",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    // Shared service/provider/transaction dependencies can fail outside AI/media.
    responses[503] = {
      description: "Required dependency unavailable or feature disabled",
      content: jsonContent(ref("ErrorEnvelope")),
    };
    if (
      [
        "sendAiMessage",
        "createMealPlanProposal",
        "confirmMealPlanProposal",
        "recognizeIngredients",
        "confirmPantryProposal",
        "generateVideoSummary",
        "generateVideoSummaryFromVideoId",
      ].includes(route.operationId)
    ) {
      responses[502] = {
        description: "AI provider failure or invalid structured output",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    }
    if (["generateVideoSummary", "generateVideoSummaryFromVideoId"].includes(route.operationId)) {
      responses[422] = {
        description: "Video summary unsupported by the configured provider",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    }
    for (const [status, response] of Object.entries(responses)) {
      const codes = {
        400: "BAD_REQUEST, VALIDATION_ERROR, INVALID_JSON, INVALID_ID",
        401: "TOKEN_MISSING, TOKEN_INVALID, TOKEN_EXPIRED, TOKEN_REVOKED, UNAUTHORIZED",
        403: "FORBIDDEN, ACCOUNT_DISABLED, ACCOUNT_SUSPENDED, ACCOUNT_DELETED",
        404: "NOT_FOUND, USER_NOT_FOUND, ROUTE_NOT_FOUND",
        409: "CONFLICT, DUPLICATE_KEY, VERSION_CONFLICT, COUNTER_CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        422: "AI_VIDEO_UNSUPPORTED",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_ERROR",
        502: "AI_PROVIDER_ERROR, AI_TIMEOUT, AI_INVALID_OUTPUT",
        503: "SERVICE_UNAVAILABLE, DEPENDENCY_UNAVAILABLE, TRANSACTIONS_REQUIRED; Firebase: AUTH_PROVIDER_ERROR; AI: AI_DISABLED/AI_UNAVAILABLE; storage: STORAGE_PROVIDER_ERROR; readiness: DATABASE_UNAVAILABLE",
      };
      if (codes[status])
        response.description += `. Các mã có thể gặp từ middleware/service: ${codes[status]}. Mã cụ thể phụ thuộc nhánh thực thi.`;
      if (
        status === "409" &&
        ["confirmMealPlanProposal", "confirmPantryProposal"].includes(route.operationId)
      )
        response.description +=
          " Proposal hết hạn: AI_PROPOSAL_EXPIRED; tranh chấp claim: AI_PROPOSAL_UNAVAILABLE; nguyên liệu chưa giải quyết được: AI_UNRESOLVED_INGREDIENTS; trạng thái/xác nhận khác: CONFLICT.";
      response.headers = { "X-Request-Id": requestIdHeader };
      if (status === "429") {
        response.headers.RateLimit = {
          description:
            "Thông tin quota và thời gian reset của limiter (draft-8); tên policy/quota phụ thuộc cấu hình.",
          schema: { type: "string" },
        };
        response.headers["RateLimit-Policy"] = {
          description: "Chính sách quota/window hiện áp dụng (draft-8).",
          schema: { type: "string" },
        };
        response.headers["Retry-After"] = {
          description:
            "Số giây trước khi nên retry request bị giới hạn; chỉ có khi limiter phát header.",
          schema: { type: "string" },
        };
      }
      response.content["application/json"].examples = {
        example: {
          summary:
            Number(status) < 400 ? "Kết quả thành công minh họa" : `Lỗi HTTP ${status} minh họa`,
          description:
            "Ví dụ tổng hợp; giá trị/mã lỗi thực tế phụ thuộc nhánh nghiệp vụ. Schema là hợp đồng cấu trúc.",
          value:
            Number(status) < 400
              ? schemaExample(registry.schemas[route.response], registry.schemas)
              : errorExample(status),
        },
      };
    }
    const summary = baseline.get(`${route.method} ${route.path}`)?.summary ?? route.operationId;
    const operation = {
      tags: [route.module],
      summary,
      description: operationDescription(route, summary, registry),
      operationId: route.operationId,
      "x-auth": route.auth,
      "x-tests": route.tests,
      security:
        route.auth === "public"
          ? []
          : route.auth === "optional"
            ? [{}, { bearerAuth: [] }]
            : [{ bearerAuth: [] }],
      parameters,
      ...(route.request.body
        ? {
            requestBody: {
              required: !registry.container.validation[route.operationId].body.safeParse({})
                .success,
              description:
                "JSON theo schema. Trường không có trong schema bị từ chối khi additionalProperties=false; bỏ qua trường optional khác với gửi null. Thay ID ví dụ bằng resource thật có quyền truy cập.",
              content: {
                "application/json": {
                  schema: ref(route.request.body),
                  examples: requestExamples(route, registry),
                },
              },
            },
          }
        : {}),
      responses,
    };
    doc.paths[path] ??= {};
    if (doc.paths[path][route.method.toLowerCase()])
      throw new Error(`Duplicate OpenAPI operation: ${route.method} ${path}`);
    doc.paths[path][route.method.toLowerCase()] = operation;
  }
  return doc;
}

export const renderOpenApi = async (registry) =>
  prettier.format(
    yaml.stringify(generateOpenApi(registry), { lineWidth: 0, aliasDuplicateObjects: false }),
    {
      ...(await prettier.resolveConfig(fileURLToPath(new URL("../.prettierrc", import.meta.url)))),
      parser: "yaml",
    },
  );
export async function writeOpenApi({ check = false, registry } = {}) {
  const target = new URL("../docs/openapi.yaml", import.meta.url);
  const output = await renderOpenApi(registry);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== output)
      throw new Error("docs/openapi.yaml is stale; run npm run docs:generate");
  } else fs.writeFileSync(target, output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await writeOpenApi({ check: process.argv.includes("--check") });
