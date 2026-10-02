import fs from "fs";
import path from "path";
import { apiManifest } from "../src/routes/api-manifest.js";

let markdown = `# API Matrix\n\n| Actor | Mobile screen/use case | Endpoint | Method | Auth | Request schema | Response schema | Module | Test |\n|---|---|---|---|---|---|---|---|---|\n`;

apiManifest.forEach((route) => {
  const actor = route.auth === "public" ? "Guest/User" : route.auth === "admin" ? "Admin" : "User";
  markdown += `| ${actor} | TBD | \`${route.path}\` | \`${route.method}\` | ${route.auth} | ${route.operationId}Request | ${route.operationId}Response | ${route.module} | contract.test.js |\n`;
});

markdown += `| Guest | Firebase Login | N/A | CLIENT_ONLY | N/A | N/A | N/A | Auth | N/A |\n`;

fs.writeFileSync(path.join(process.cwd(), "docs", "api-matrix.md"), markdown);
console.log("Generated api-matrix.md with " + apiManifest.length + " routes.");
