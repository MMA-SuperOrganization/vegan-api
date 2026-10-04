import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import yaml from "yaml";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { CREATED } from "../../src/routes/index.js";
import { readSourceEndpoints, sourceAuth } from "../../src/contracts/source-spec.js";
import {
  assertConcreteSchemas,
  convertValidator,
  createContractRegistry,
} from "../../src/contracts/registry.js";
import {
  generateOpenApi,
  renderOpenApi,
  openApiPath,
  writeOpenApi,
} from "../../scripts/generate-openapi.js";
import { renderMatrix, writeMatrix } from "../../scripts/generate-matrix.js";
import { buildTestApp } from "../helpers/test-app.js";
import { expectedOperationIds } from "./operation-ids.js";

const key = ({ method, path }) => `${method.toUpperCase()} ${path}`;
const sorted = (values) => [...values].sort();
const baseline = readSourceEndpoints();
const registry = createContractRegistry();
const openapi = yaml.parse(
  fs.readFileSync(new URL("../../docs/openapi.yaml", import.meta.url), "utf8"),
);
const matrix = fs.readFileSync(new URL("../../docs/api-matrix.md", import.meta.url), "utf8");

function assertEndpointSet(actual, expected) {
  const actualKeys = actual.map(key);
  const expectedKeys = expected.map(key);
  expect(new Set(actualKeys).size, "duplicate method/path").toBe(actualKeys.length);
  expect(sorted(actualKeys), "missing or extra method/path").toEqual(sorted(expectedKeys));
}
const documentedOperations = (doc) =>
  Object.entries(doc.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      method: method.toUpperCase(),
      path: path.replace(/\{([^}]+)\}/g, ":$1"),
      ...operation,
    })),
  );

// These assertions replace the previous integration test's path-only comparison.
// Required method/path/auth comes from source chapters 11/13, NOT apiManifest.
describe("Independent source -> mounted API -> OpenAPI -> matrix contract", () => {
  it("reads the exact 184 required source rows and stable ID expectations", () => {
    expect(baseline).toHaveLength(184);
    expect(
      readSourceEndpoints("## 11. API\n| GET    | `/health`     | public   | Health |"),
    ).toMatchObject([{ method: "GET", path: "/health", auth: "public", summary: "Health" }]);
    expect(expectedOperationIds.size).toBe(184);
    expect(sorted(expectedOperationIds.keys())).toEqual(sorted(baseline.map(key)));
    expect(new Set(apiManifest.map((route) => route.operationId)).size).toBe(184);
    assertEndpointSet(apiManifest, baseline);
    for (const endpoint of baseline) {
      const actual = apiManifest.find((route) => key(route) === key(endpoint));
      expect(actual.operationId).toBe(expectedOperationIds.get(key(endpoint)));
      expect(actual.auth).toBe(sourceAuth(endpoint));
    }
  });

  it("rejects missing methods, undocumented extras and duplicate operations", () => {
    expect(() => assertEndpointSet(apiManifest.slice(1), baseline)).toThrow();
    expect(() =>
      assertEndpointSet([...apiManifest, { method: "GET", path: "/undocumented" }], baseline),
    ).toThrow();
    expect(() => assertEndpointSet([...apiManifest, apiManifest[0]], baseline)).toThrow();
    const mutated = apiManifest.map((route, index) =>
      index === 0 ? { ...route, method: "POST" } : route,
    );
    expect(() => assertEndpointSet(mutated, baseline)).toThrow();
  });

  it("matches actual mounted Express router stacks and authentication middleware", () => {
    const { app, container, env } = buildTestApp();
    const mounts = app.router.stack.filter((layer) =>
      layer.handle?.stack?.some((child) => child.route),
    );
    expect(mounts).toHaveLength(1);
    const mount = mounts[0];
    expect(mount.matchers.some((matcher) => matcher(env.apiPrefix))).toBe(true);
    expect(mount.matchers.some((matcher) => matcher("/wrong-prefix"))).toBe(false);
    const mounted = mount.handle.stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route.methods)
          .filter((method) => layer.route.methods[method])
          .map((method) => ({ method: method.toUpperCase(), path: layer.route.path, layer })),
      );
    assertEndpointSet(mounted, baseline);
    expect(Object.keys(container.operations).sort()).toEqual(sorted(expectedOperationIds.values()));
    expect(Object.keys(container.validation).sort()).toEqual(sorted(expectedOperationIds.values()));
    for (const route of mounted) {
      const source = baseline.find((endpoint) => key(endpoint) === key(route));
      const auth = sourceAuth(source);
      const handlers = route.layer.route.stack.map((layer) => layer.handle);
      const expectedGuard =
        auth === "firebase"
          ? container.auth.firebaseAuthenticate
          : auth === "optional"
            ? container.auth.optionalAuthenticate
            : auth === "public"
              ? null
              : container.auth.authenticate;
      for (const guard of [
        container.auth.authenticate,
        container.auth.optionalAuthenticate,
        container.auth.firebaseAuthenticate,
      ])
        expect(handlers.includes(guard)).toBe(guard === expectedGuard);
      // Run the actual mounted admin guard rather than trust a middleware name.
      if (auth === "admin") {
        let denied;
        handlers[1]({ auth: { role: "user" } }, {}, (error) => {
          denied = error;
        });
        expect(denied.statusCode).toBe(403);
        let allowed = false;
        handlers[1]({ auth: { role: "admin" } }, {}, (error) => {
          expect(error).toBeUndefined();
          allowed = true;
        });
        expect(allowed).toBe(true);
      }
      const registration = app.locals.businessRoutes.find((item) => key(item) === key(route));
      expect(handlers).toEqual(registration.middleware);
      expect(registration.validation).toBe(
        container.validation[expectedOperationIds.get(key(route))],
      );
      expect(handlers.length).toBeGreaterThanOrEqual(auth === "public" ? 2 : 3);
    }
  });

  it("OpenAPI has each method, stable ID, exact auth, status and validator constraints", () => {
    assertEndpointSet(documentedOperations(openapi), baseline);
    expect(openapi.openapi).toBe("3.1.0");
    expect(
      new Set(documentedOperations(openapi).map((operation) => operation.operationId)).size,
    ).toBe(184);
    for (const route of registry.operations) {
      const operation = openapi.paths[openApiPath(route.path)][route.method.toLowerCase()];
      expect(operation.operationId).toBe(expectedOperationIds.get(key(route)));
      expect(operation["x-auth"]).toBe(route.auth);
      expect(operation.security).toEqual(
        route.auth === "public"
          ? []
          : route.auth === "optional"
            ? [{}, { bearerAuth: [] }]
            : [{ bearerAuth: [] }],
      );
      const status = CREATED.has(route.operationId) ? "201" : "200";
      expect(operation.responses[status].content["application/json"].schema.$ref).toBe(
        `#/components/schemas/${route.response}`,
      );
      expect(operation.responses[status === "200" ? "201" : "200"]).toBeUndefined();
      const pathNames = [...route.path.matchAll(/:([\w]+)/g)].map((match) => match[1]);
      expect(
        operation.parameters
          .filter((parameter) => parameter.in === "path")
          .map((parameter) => parameter.name),
      ).toEqual(pathNames);
      for (const parameter of operation.parameters) {
        const location = parameter.in === "path" ? "params" : "query";
        expect(parameter.schema).toEqual(
          registry.schemas[route.request[location]].properties[parameter.name],
        );
        if (parameter.in === "path") expect(parameter.required).toBe(true);
      }
      if (route.request.body) {
        expect(operation.requestBody.content["application/json"].schema.$ref).toBe(
          `#/components/schemas/${route.request.body}`,
        );
        expect(openapi.components.schemas[route.request.body]).toEqual(
          convertValidator(registry.container.validation[route.operationId].body),
        );
      } else expect(operation.requestBody).toBeUndefined();
      expect(operation.responses[400].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/ErrorEnvelope",
      );
    }
  });

  it("matrix links only real request/response components and dedicated test paths", () => {
    const rows = matrix
      .split("\n")
      .filter(
        (line) => line.startsWith("| ") && !line.match(/^\| Actor\s+\|/) && !line.match(/^\|\s*-+/),
      )
      .map((line) => line.replace(/ +/g, " "));
    const backendRows = rows.filter((row) => !row.includes("CLIENT_ONLY"));
    expect(backendRows).toHaveLength(184);
    for (const route of registry.operations) {
      const row = backendRows.find((row) =>
        row.includes(`| \`${route.path}\` | \`${route.method}\` |`),
      );
      expect(row).toBeTruthy();
      expect(row).toContain(`| ${route.auth} |`);
      expect(row).toContain(`\`${route.response}\` (${route.status})`);
      for (const component of Object.values(route.request)) {
        expect(row).toContain(`\`${component}\``);
        expect(openapi.components.schemas[component]).toBeTruthy();
      }
      expect(openapi.components.schemas[route.response]).toBeTruthy();
      expect(route.tests).toHaveLength(2);
      for (const test of route.tests) {
        expect(test).toMatch(/^tests\/.+\.test\.js$/);
        expect(fs.existsSync(new URL(`../../${test}`, import.meta.url)), test).toBe(true);
        expect(row).toContain(`../${test}`);
      }
    }
    expect(rows.filter((row) => row.includes("CLIENT_ONLY"))).toHaveLength(3);
    expect(matrix).not.toContain("TBD");
    expect(matrix).not.toMatch(/\| contract\.test\.js \|/);
  });

  it("generation is pure, reproducible and check mode compares both committed outputs", async () => {
    expect(await renderOpenApi(registry)).toBe(
      fs.readFileSync(new URL("../../docs/openapi.yaml", import.meta.url), "utf8"),
    );
    expect(await renderMatrix(registry)).toBe(matrix);
    expect(generateOpenApi(registry)).toEqual(openapi);
    expect(await renderOpenApi(createContractRegistry())).toBe(await renderOpenApi(registry));
    await expect(writeOpenApi({ check: true, registry })).resolves.toBeUndefined();
    await expect(writeMatrix({ check: true, registry })).resolves.toBeUndefined();
    const changed = { ...registry, operations: registry.operations.slice(1) };
    await expect(writeOpenApi({ check: true, registry: changed })).rejects.toThrow(/stale/);
    await expect(writeMatrix({ check: true, registry: changed })).rejects.toThrow(/stale/);
  }, 30000);

  it("fails unsupported native conversion and rejects unconstrained/unresolved schemas", () => {
    expect(() => convertValidator(z.string().transform((value) => value.length))).not.toThrow(); // representable wire input
    expect(() => convertValidator(z.custom())).toThrow();
    expect(() => assertConcreteSchemas({ Broken: {} })).toThrow(/Unconstrained/);
    expect(() => assertConcreteSchemas({ Broken: { type: "array", items: {} } })).toThrow(
      /Unconstrained/,
    );
    expect(() =>
      assertConcreteSchemas({ Broken: { $ref: "#/components/schemas/Missing" } }),
    ).toThrow(/Unresolved/);
    expect(() => assertConcreteSchemas(openapi.components.schemas)).not.toThrow();
    expect(openapi.components.schemas.ErrorEnvelope.required).toEqual(["success", "error", "meta"]);
    expect(openapi.components.schemas.PaginationMeta.required).toContain("totalPages");
    expect(openapi.components.schemas.Account.properties).not.toHaveProperty("fcmTokens");
    expect(openapi.components.schemas.SafeAiFeedback.properties).not.toHaveProperty("userId");
    expect(openapi.components.schemas.SafeAiFeedback.properties).not.toHaveProperty("comment");
  });
});
