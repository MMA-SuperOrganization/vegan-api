import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(root, "tests/playwright/cases.json"), "utf8"));
const workbook = path.join(root, "..", catalog.source);
if (fs.existsSync(workbook))
  assert.equal(
    createHash("sha256").update(fs.readFileSync(workbook)).digest("hex"),
    catalog.sha256,
    "Workbook changed: re-import cases before running coverage",
  );
const output = execFileSync(
  process.execPath,
  [path.join(root, "node_modules/@playwright/test/cli.js"), "test", "--list", "--reporter=json"],
  { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
);
const listing = JSON.parse(output);
assert.deepEqual(listing.errors ?? [], [], "Playwright collection errors");
const registered = [];
function walk(suite) {
  for (const spec of suite.specs ?? []) {
    const match = spec.title.match(/^(API|BIZ|NFR)-\d{4}/);
    assert(match, `Test is missing a workbook ID: ${spec.title}`);
    for (const test of spec.tests) registered.push(match[0]);
  }
  for (const child of suite.suites ?? []) walk(child);
}
walk(listing);
const expected = catalog.cases.map((c) => c.id);
assert.equal(new Set(expected).size, expected.length, "Duplicate workbook IDs");
assert.equal(new Set(registered).size, registered.length, "Duplicate Playwright IDs");
assert.deepEqual(registered.sort(), expected.sort(), "Missing/extra Playwright test cases");
for (const [prefix, count] of [
  ["API", 764],
  ["BIZ", 53],
  ["NFR", 24],
])
  assert.equal(expected.filter((id) => id.startsWith(prefix)).length, count);
console.log(
  "Playwright coverage: 841/841 unique workbook IDs (764 API, 53 business, 24 NFR). Coverage means registered scenarios, not passing staging acceptance.",
);
