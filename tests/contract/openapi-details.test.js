import { describe, expect, it } from "vitest";
import request from "supertest";
import { createContractRegistry } from "../../src/contracts/registry.js";
import { generateOpenApi, openApiPath } from "../../scripts/generate-openapi.js";
import { assertResponse } from "./assert-response.js";
import { buildTestApp } from "../helpers/test-app.js";
import { operationNotes } from "../../scripts/openapi-details.js";

const registry = createContractRegistry();
const doc = generateOpenApi(registry);
describe("Detailed Swagger documentation stays usable and accurate", () => {
  it("documents all operations, parameters, tags and schema fields", () => {
    expect(registry.operations).toHaveLength(184);
    expect(Object.keys(operationNotes).sort()).toEqual(
      registry.operations.map((route) => route.operationId).sort(),
    );
    expect(doc.tags.every((tag) => tag.description?.length > 30)).toBe(true);
    for (const route of registry.operations) {
      const operation = doc.paths[openApiPath(route.path)][route.method.toLowerCase()];
      expect(operation.description, route.operationId).toContain("**Quyền truy cập:**");
      expect(operation.description).toContain("**Nghiệp vụ:**");
      for (const parameter of operation.parameters)
        expect(parameter.description.length).toBeGreaterThan(10);
    }
    function visit(schema) {
      expect(schema.description?.length).toBeGreaterThan(5);
      Object.values(schema.properties ?? {}).forEach(visit);
      (schema.anyOf ?? schema.oneOf ?? []).forEach(visit);
      if (schema.items) visit(schema.items);
    }
    Object.values(doc.components.schemas).forEach(visit);
  });

  it("validates path/query parameter examples as wire inputs", () => {
    for (const route of registry.operations) {
      const operation = doc.paths[openApiPath(route.path)][route.method.toLowerCase()];
      for (const location of ["params", "query"]) {
        const validator = registry.container.validation[route.operationId][location];
        if (!validator) continue;
        const parameters = operation.parameters.filter(
          (parameter) => parameter.in === (location === "params" ? "path" : "query"),
        );
        const wire = (value) =>
          location === "query" && ["number", "boolean"].includes(typeof value)
            ? String(value)
            : value;
        const required = Object.fromEntries(
          parameters.filter((p) => p.required).map((p) => [p.name, wire(p.example)]),
        );
        for (const parameter of parameters) {
          expect(parameter).toHaveProperty("example");
          const input = { ...required, [parameter.name]: wire(parameter.example) };
          const result = validator.safeParse(input);
          expect(
            result.success,
            `${route.operationId}.${parameter.name}: ${JSON.stringify(result.error?.issues)}`,
          ).toBe(true);
        }
      }
    }
  });

  it("validates every request example against actual Zod including refinements", () => {
    for (const route of registry.operations.filter((r) => r.request.body)) {
      const operation = doc.paths[openApiPath(route.path)][route.method.toLowerCase()];
      const body = operation.requestBody;
      const validator = registry.container.validation[route.operationId].body;
      expect(body.required, route.operationId).toBe(!validator.safeParse({}).success);
      const examples = body.content["application/json"].examples;
      expect(Object.keys(examples).length).toBeGreaterThan(0);
      for (const { value } of Object.values(examples)) {
        const result = validator.safeParse(value);
        expect(
          result.success,
          `${route.operationId}: ${JSON.stringify(result.error?.issues)}`,
        ).toBe(true);
      }
    }
    expect(doc.paths["/food-items/{id}"].patch.requestBody.required).toBe(true);
    expect(doc.paths["/notifications/{id}/read"].patch.requestBody.required).toBe(false);
  });

  it("validates success/error examples and documents request correlation", () => {
    for (const route of registry.operations) {
      const operation = doc.paths[openApiPath(route.path)][route.method.toLowerCase()];
      for (const [status, response] of Object.entries(operation.responses)) {
        const content = response.content["application/json"];
        for (const { value } of Object.values(content.examples)) {
          assertResponse(
            value,
            content.schema,
            doc.components.schemas,
            `${route.operationId}.${status}`,
          );
          expect(value.meta.requestId).toBe(response.headers["X-Request-Id"].example);
        }
      }
    }
  });

  it("limits unsupported-video errors to video summary operations", () => {
    const unsupported = registry.operations.filter(
      (route) => doc.paths[openApiPath(route.path)][route.method.toLowerCase()].responses[422],
    );
    expect(unsupported.map((route) => route.operationId).sort()).toEqual([
      "generateVideoSummary",
      "generateVideoSummaryFromVideoId",
    ]);
    expect(doc.paths["/categories"].post.responses[503]).toBeTruthy();
    expect(doc.servers[0].url).toBe("/api/v1");
  });

  it("serves the generated detailed spec in the Swagger JSON endpoint", async () => {
    const { app } = buildTestApp({ envOverrides: { SWAGGER_ENABLED: "true" } });
    const response = await request(app).get("/api-docs.json");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(doc);
    expect((await request(app).get("/api-docs/")).status).toBe(200);
  });

  it("uses the configured API prefix for Swagger Try it out", async () => {
    const { app } = buildTestApp({
      envOverrides: { SWAGGER_ENABLED: "true", API_PREFIX: "/custom/v1" },
    });
    const response = await request(app).get("/api-docs.json");
    expect(response.status).toBe(200);
    expect(response.body.servers[0].url).toBe("/custom/v1");
    expect(response.body.servers[1].variables.apiPrefix.default).toBe("/custom/v1");
    expect((await request(app).get("/custom/v1/health")).status).toBe(200);
  });
});
