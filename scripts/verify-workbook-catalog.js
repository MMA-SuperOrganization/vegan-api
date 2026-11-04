import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

const CATALOG = new URL("./catalog-data/vegeta-workbook-catalog.json", import.meta.url);

export async function verifyWorkbookCatalog(container, catalog) {
  const foodSlugs = catalog.foods.map((food) => food.slug);
  const recipeSlugs = catalog.recipes.map((recipe) => recipe.slug);
  const postMarkers = catalog.posts.map((post) => post.marker);
  const [foods, recipes, posts] = await Promise.all([
    container.models.foodItems.find({ slug: { $in: foodSlugs } }).lean(),
    container.models.recipes.find({ slug: { $in: recipeSlugs } }).lean(),
    container.models.posts.find({ tags: { $in: postMarkers } }).lean(),
  ]);
  const counts = {
    foods: foods.length,
    verifiedFoods: foods.filter((food) => food.nutritionDataQuality === "verified").length,
    recipes: recipes.length,
    variants: recipes.reduce((sum, recipe) => sum + (recipe.variants?.length ?? 0), 0),
    posts: posts.length,
  };
  for (const key of ["foods", "verifiedFoods", "recipes", "variants", "posts"])
    if (counts[key] !== catalog.stats[key])
      throw new Error(
        `Workbook verification failed for ${key}: ${counts[key]} != ${catalog.stats[key]}`,
      );
  return counts;
}

export async function main() {
  const catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
  const env = loadEnv();
  const logger = createLogger(env);
  const { createContainer } = await import("../src/container.js");
  const container = createContainer({
    env,
    logger,
    overrides: {
      authProvider: null,
      storageProvider: null,
      aiProvider: null,
      messagingProvider: null,
    },
  });
  try {
    await connectDatabase({ ...env.database, logger });
    const counts = await verifyWorkbookCatalog(container, catalog);
    logger.info({ counts }, "Workbook catalog verification passed");
    return counts;
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
