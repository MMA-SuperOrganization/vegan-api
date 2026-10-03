import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import prettier from "prettier";
import { createContractRegistry } from "../src/contracts/registry.js";
import { readSourceEndpoints } from "../src/contracts/source-spec.js";

const cell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
export async function renderMatrix(registry = createContractRegistry()) {
  const baseline = new Map(
    readSourceEndpoints().map((route) => [`${route.method} ${route.path}`, route]),
  );
  let output =
    "# API Matrix\n\nGenerated deterministically from the explicit container registry. Mandatory endpoint baseline: source specification chapters 11 and 13. Schema names refer to actual OpenAPI components; test links refer to dedicated suites plus the independent contract suite. Optional authentication still permits guests.\n\n| Actor | Mobile screen/use case | Endpoint | Method | Auth | Request schema | Response schema | Module | Test |\n|---|---|---|---|---|---|---|---|---|\n";
  for (const route of registry.operations) {
    const actor =
      route.auth === "admin"
        ? "Admin"
        : ["public", "optional"].includes(route.auth)
          ? "Guest/User/Admin"
          : route.auth === "firebase"
            ? "Firebase identity"
            : "User/Admin";
    const useCase = baseline.get(`${route.method} ${route.path}`)?.summary ?? route.operationId;
    const requests =
      Object.entries(route.request)
        .map(([location, name]) => `${location}: \`${name}\``)
        .join("; ") || "No payload";
    const tests = route.tests
      .map((test) => `[${test}](${test.startsWith("tests/") ? `../${test}` : test})`)
      .join("; ");
    output += `| ${[actor, useCase, `\`${route.path}\``, `\`${route.method}\``, route.auth, requests, `\`${route.response}\` (${route.status})`, route.module, tests].map(cell).join(" | ")} |\n`;
  }
  for (const useCase of ["Login", "Register", "Reset password"])
    output += `| Guest | Firebase ${useCase}: Firebase client SDK handles credentials; backend account sync is documented above | N/A | CLIENT_ONLY | Firebase client SDK | N/A | N/A | Auth | N/A (client SDK) |\n`;
  return prettier.format(output, {
    ...(await prettier.resolveConfig(fileURLToPath(new URL("../.prettierrc", import.meta.url)))),
    parser: "markdown",
  });
}
export async function writeMatrix({ check = false, registry } = {}) {
  const target = new URL("../docs/api-matrix.md", import.meta.url);
  const output = await renderMatrix(registry);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== output)
      throw new Error("docs/api-matrix.md is stale; run npm run docs:generate");
  } else fs.writeFileSync(target, output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await writeMatrix({ check: process.argv.includes("--check") });
