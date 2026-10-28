import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { FoodItemsModel } from "../src/modules/food-items/food-items.model.js";
import { RecipesModel } from "../src/modules/recipes/recipes.model.js";
import "../src/modules/categories/categories.model.js";
import { foodImageQuery, normalizeImageQuery, pickCommonsImage } from "./lib/wikimedia-images.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const CACHE_PATH = resolve("scripts/catalog-data/wikimedia-image-cache.json");
const USER_AGENT =
  "VEGETA/1.0 (https://github.com/MMA-SuperOrganization/vegan-api-mma302; catalog image enrichment)";
const CATEGORY_SEARCH_TERMS = Object.freeze({
  Vegetables: "fresh vegetables assortment",
  Fruits: "fresh fruit assortment",
  "Nuts & Seeds": "nuts and seeds assortment",
  Grains: "whole grains assortment",
  Legumes: "legumes assortment",
  "Plant Proteins": "tofu tempeh",
  "Oils & Fats": "cooking oils",
  "Herbs & Spices": "herbs and spices assortment",
});
const args = new Set(process.argv.slice(2));
const supported = new Set([
  "--apply",
  "--refresh",
  "--retry-missing",
  "--replace-wikimedia",
  "--recipes-only",
]);
for (const arg of args) if (!supported.has(arg)) throw new Error(`Unsupported argument: ${arg}`);

const missingImage = (field) => ({
  $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: "" }],
});
const sleep = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));
const readCache = async () => {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
};
const saveCache = async (cache) => {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
};
const searchCommons = async (query) => {
  const url = new URL(COMMONS_API);
  Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo|info",
    inprop: "url",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1200",
    origin: "*",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Wikimedia request failed (${response.status}) for ${query}`);
  return pickCommonsImage(await response.json(), query);
};

const resolveImages = async (queries, cache) => {
  const pending = queries.filter((query) => {
    const key = normalizeImageQuery(query).toLowerCase();
    return (
      key &&
      (args.has("--refresh") ||
        !Object.hasOwn(cache, key) ||
        (args.has("--retry-missing") && cache[key] === null))
    );
  });
  let completed = 0;
  const resolveOne = async (query) => {
    const key = normalizeImageQuery(query).toLowerCase();
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        cache[key] = await searchCommons(query);
        return;
      } catch (error) {
        lastError = error;
        await sleep(attempt * 1000);
      }
    }
    if (!Object.hasOwn(cache, key)) cache[key] = null;
    console.warn(JSON.stringify({ query, error: lastError?.message ?? "Unknown Wikimedia error" }));
  };
  for (let offset = 0; offset < pending.length; offset += 1) {
    const batch = pending.slice(offset, offset + 1);
    await Promise.all(batch.map(resolveOne));
    completed += batch.length;
    if (completed % 20 === 0 || completed === pending.length) {
      await saveCache(cache);
      console.log(JSON.stringify({ searched: completed, pending: pending.length }));
    }
    await sleep(500);
  }
  await saveCache(cache);
};

const imageFor = (cache, query) => cache[normalizeImageQuery(query).toLowerCase()] ?? null;
const run = async () => {
  const env = loadEnv();
  await mongoose.connect(env.database.uri, {
    dbName: env.database.dbName,
    serverSelectionTimeoutMS: env.database.serverSelectionTimeoutMs,
    autoIndex: false,
  });
  const includeWikimedia = args.has("--replace-wikimedia");
  const foodImageFilter = includeWikimedia
    ? {
        $or: [
          ...missingImage("imageUrl").$or,
          { "imageAttribution.provider": "Wikimedia Commons" },
        ],
      }
    : missingImage("imageUrl");
  const recipeImageFilter = includeWikimedia
    ? {
        $or: [
          ...missingImage("coverImageUrl").$or,
          { "imageAttribution.provider": "Wikimedia Commons" },
        ],
      }
    : missingImage("coverImageUrl");
  const [foods, recipes] = await Promise.all([
    args.has("--recipes-only")
      ? []
      : FoodItemsModel.find({ status: "active", ...foodImageFilter }, { name: 1, categoryId: 1 })
          .populate("categoryId", "name")
          .lean(),
    RecipesModel.find(
      { status: "published", visibility: "public", ...recipeImageFilter },
      { title: 1, cuisine: 1, tags: 1, "ingredients.foodNameSnapshot": 1 },
    ).lean(),
  ]);
  const foodQueries = [...new Set(foods.map((food) => foodImageQuery(food.name)).filter(Boolean))];
  const recipeQueries = [...new Set(recipes.map((recipe) => normalizeImageQuery(recipe.title)))];
  const categoryQueries = [
    ...new Set(
      foods
        .map((food) => CATEGORY_SEARCH_TERMS[food.categoryId?.name] ?? food.categoryId?.name)
        .filter(Boolean),
    ),
  ];
  const cache = await readCache();
  await resolveImages([...categoryQueries, ...recipeQueries, ...foodQueries], cache);

  const categoryFallbacks = new Map(
    foods.map((food) => {
      const category = food.categoryId?.name;
      const query = CATEGORY_SEARCH_TERMS[category] ?? category;
      return [category, imageFor(cache, query)];
    }),
  );
  const genericFoodImage = imageFor(cache, "fresh vegetables assortment");
  const foodUpdates = foods.map((food) => {
    const image =
      imageFor(cache, foodImageQuery(food.name)) ??
      categoryFallbacks.get(food.categoryId?.name) ??
      genericFoodImage;
    return image
      ? {
          updateOne: {
            filter: { _id: food._id, ...foodImageFilter },
            update: {
              $set: {
                imageUrl: image.imageUrl,
                imageAttribution: image.attribution,
                updatedAt: new Date(),
              },
            },
          },
        }
      : null;
  });
  const recipeUpdates = recipes.map((recipe) => {
    const image = imageFor(cache, recipe.title);
    return image
      ? {
          updateOne: {
            filter: { _id: recipe._id, ...recipeImageFilter },
            update: {
              $set: {
                coverImageUrl: image.imageUrl,
                imageAttribution: image.attribution,
                updatedAt: new Date(),
              },
            },
          },
        }
      : null;
  });
  const validFoodUpdates = foodUpdates.filter(Boolean);
  const validRecipeUpdates = recipeUpdates.filter(Boolean);
  console.log(
    JSON.stringify({
      mode: args.has("--apply") ? "apply" : "preview",
      missing: { foods: foods.length, recipes: recipes.length },
      resolved: { foods: validFoodUpdates.length, recipes: validRecipeUpdates.length },
      uniqueQueries: { foods: foodQueries.length, recipes: recipeQueries.length },
    }),
  );
  if (!args.has("--apply")) return;
  const [foodResult, recipeResult] = await Promise.all([
    validFoodUpdates.length ? FoodItemsModel.bulkWrite(validFoodUpdates) : null,
    validRecipeUpdates.length ? RecipesModel.bulkWrite(validRecipeUpdates) : null,
  ]);
  console.log(
    JSON.stringify({
      updated: {
        foods: foodResult?.modifiedCount ?? 0,
        recipes: recipeResult?.modifiedCount ?? 0,
      },
    }),
  );
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
