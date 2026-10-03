throw new Error(
  "RETIRED: fix-auth.js is a historical bulk rewrite and would overwrite active authorization wiring. Do not run it.",
);

import fs from "fs";
import path from "path";

const modulesDir = path.join(process.cwd(), "src/modules");
const modules = fs.readdirSync(modulesDir);

modules.forEach((m) => {
  try {
    let p = path.join(modulesDir, m, m + ".routes.js");
    let c = fs.readFileSync(p, "utf8");
    c = c.replace(
      /import \{ authenticate, optionalAuthenticate \} from ["'].*?authenticate\.js["'];/g,
      'import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";',
    );
    fs.writeFileSync(p, c);
  } catch (e) {}
});
