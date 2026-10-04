import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { createContractRegistry } from "../../src/contracts/registry.js";

const checklist = readFileSync(new URL("../../docs/product-checklist.md", import.meta.url), "utf8");
const operations = [
  ...checklist.matchAll(/^\|\s*(\d+)\s*\|\s*`(GET|POST|PUT|PATCH|DELETE) ([^`]+)`\s*\|/gm),
].map((match) => ({
  number: Number(match[1]),
  method: match[2],
  path: match[3],
}));
describe("independent product checklist endpoint baseline", () => {
  it("implements every one of the 184 numbered product operations, without duplicates or extras", () => {
    expect(operations.map((row) => row.number)).toEqual(
      Array.from({ length: 184 }, (_, i) => i + 1),
    );
    const keys = (rows) => rows.map((row) => `${row.method} ${row.path}`).sort();
    expect(new Set(keys(operations)).size).toBe(184);
    expect(keys(apiManifest)).toEqual(keys(operations));
  });
  it("has a concrete validator, controller and response contract for every checklist API", () => {
    const registry = createContractRegistry();
    for (const row of operations) {
      const route = registry.operations.find(
        (route) => route.method === row.method && route.path === row.path,
      );
      expect(route, `${row.method} ${row.path}`).toBeTruthy();
      expect(registry.container.controllers[route.operationId]).toBeTypeOf("function");
      expect(registry.container.validation[route.operationId]).toBeTruthy();
      expect(registry.schemas[route.response]).toBeTruthy();
    }
  });
});
