throw new Error(
  "RETIRED: generate-modules.js is historical scaffolding and would overwrite active code. Do not run it.",
);

import fs from "fs";
import path from "path";

const modules = [
  "app-config",
  "home",
  "auth",
  "onboarding",
  "nutrition-profiles",
  "categories",
  "allergens",
  "food-items",
  "recipes",
  "search",
  "recommendations",
  "pantries",
  "meal-plans",
  "grocery-lists",
  "diary",
  "weight-logs",
  "water-logs",
  "posts",
  "videos",
  "comments",
  "reactions",
  "ratings",
  "saved-items",
  "view-history",
  "ai",
  "notifications",
  "reminders",
  "reports",
  "moderation",
  "admin-dashboard",
  "ai-monitoring",
  "audit-logs",
];

const basePath = path.join(process.cwd(), "src", "modules");

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

modules.forEach((mod) => {
  const modPath = path.join(basePath, mod);
  if (!fs.existsSync(modPath)) {
    fs.mkdirSync(modPath, { recursive: true });
  }

  const files = [
    "index.js",
    `${mod}.routes.js`,
    `${mod}.controller.js`,
    `${mod}.service.js`,
    `${mod}.repository.js`,
    `${mod}.model.js`,
    `${mod}.validation.js`,
  ];

  files.forEach((file) => {
    const filePath = path.join(modPath, file);
    if (!fs.existsSync(filePath)) {
      if (file === "index.js") {
        fs.writeFileSync(
          filePath,
          `// Export module endpoints\nexport * from './${mod}.routes.js';\n`,
        );
      } else {
        fs.writeFileSync(filePath, `// TODO: Implement ${file}\n`);
      }
    }
  });
});

console.log("Successfully generated module structures.");
