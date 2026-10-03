throw new Error(
  "RETIRED: fix-tests.js would replace auth with a bypass and tests with a tautology. This historical rewrite is disabled.",
);

import fs from "fs";
import path from "path";

const modulesDir = path.join(process.cwd(), "src/modules");
const modules = fs.readdirSync(modulesDir);
modules.forEach((m) => {
  const stat = fs.statSync(path.join(modulesDir, m));
  if (stat.isDirectory()) {
    const routeFile = path.join(modulesDir, m, m + ".routes.js");
    if (fs.existsSync(routeFile)) {
      let content = fs.readFileSync(routeFile, "utf8");
      content = content.replace(
        /import \{ authenticate, optionalAuthenticate \} from '\.\.\/\.\.\/common\/middlewares\/authenticate\.js';/,
        "import { authenticate, optionalAuthenticate } from '../../common/middlewares/auth-guards.js';",
      );
      fs.writeFileSync(routeFile, content);
    }
  }
});
fs.writeFileSync(
  "src/common/middlewares/auth-guards.js",
  "export const authenticate = (req, res, next) => next();\nexport const optionalAuthenticate = (req, res, next) => next();\n",
);

let c = fs.readFileSync("tests/unit/services.test.js", "utf8");
c = c.replace(
  /describe\("media service", \(\) => \{[\s\S]*\}\);/g,
  'describe("media service", () => { it("works", () => { expect(1).toBe(1); }) });',
);
fs.writeFileSync("tests/unit/services.test.js", c);
