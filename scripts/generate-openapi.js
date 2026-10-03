import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import yaml from "yaml";
import prettier from "prettier";
import { createContractRegistry, ref } from "../src/contracts/registry.js";
import { readSourceEndpoints } from "../src/contracts/source-spec.js";

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
        "Generated from the explicit container registry and native Zod 4 input schemas. Source contract: chapters 11 and 13 of AI_AGENT_PROMPT_BUILD_VEGAN_BE_A_TO_Z.md. Owner authorization is enforced by operation services; optional authentication permits guests and rejects invalid supplied tokens.",
    },
    servers: [{ url: "http://localhost:3000/api/v1", description: "Local development" }],
    tags: [...new Set(registry.operations.map((route) => route.module))]
      .sort()
      .map((name) => ({ name })),
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Firebase ID Token" },
      },
      schemas: registry.schemas,
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
          schema: property,
          ...(property.type === "array" ? { style: "form", explode: true } : {}),
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
    if (["ai", "media", "health", "videos"].includes(route.module))
      responses[503] = {
        description: "Required dependency unavailable or feature disabled",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    if (route.module === "ai" || route.operationId === "generateVideoSummaryFromVideoId") {
      responses[502] = {
        description: "AI provider failure or invalid structured output",
        content: jsonContent(ref("ErrorEnvelope")),
      };
      responses[422] = {
        description: "Video summary unsupported by the configured provider",
        content: jsonContent(ref("ErrorEnvelope")),
      };
    }
    const operation = {
      tags: [route.module],
      summary: baseline.get(`${route.method} ${route.path}`)?.summary ?? route.operationId,
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
              required: (registry.schemas[route.request.body].required ?? []).length > 0,
              content: jsonContent(ref(route.request.body)),
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
