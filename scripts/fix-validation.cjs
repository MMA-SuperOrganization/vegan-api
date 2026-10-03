throw new Error(
  "RETIRED: fix-validation.cjs is a historical bulk rewrite and would weaken active validation. Do not run it.",
);

const fs = require("fs");
const path = require("path");

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith(".validation.js")) {
      let content = fs.readFileSync(fullPath, "utf8");

      const newContent = content.replace(
        /([a-zA-Z0-9_]+):\s*z\.object\(\{([\s\S]*?)\}\),/g,
        "$1: {$2},",
      );
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log("Fixed", file);
      }
    }
  }
}

processDir(path.join(__dirname, "../src/modules"));
