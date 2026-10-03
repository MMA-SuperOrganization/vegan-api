import { pathToFileURL } from "node:url";
import { createContractRegistry } from "../src/contracts/registry.js";
import { writeOpenApi } from "./generate-openapi.js";
import { writeMatrix } from "./generate-matrix.js";

export async function generateDocs({ check = false } = {}) {
  const registry = createContractRegistry();
  // Both renderers are pure: no directory scans or existing-doc enrichment.
  await writeOpenApi({ check, registry });
  await writeMatrix({ check, registry });
  return registry;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  try {
    const registry = await generateDocs({ check });
    console.log(
      `${check ? "Checked" : "Generated"} OpenAPI and API matrix for ${registry.operations.length} explicit operations.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
