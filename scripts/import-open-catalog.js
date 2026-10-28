import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { calculateRecipeNutrition, normalizeNutrition } from "../src/common/utils/nutrition.js";
import { inferAllergens } from "./build-open-catalog.js";

const CATALOG_PATH = new URL("./catalog-data/open-catalog.json", import.meta.url);
const AUTHOR_UID = "internal:open-catalog:v1";
const AUTHOR_EMAIL = "open-catalog@example.invalid";
const CATEGORY_TYPES = new Map([
  ["Breakfast", "recipe"],
  ["Lunch", "recipe"],
  ["Dinner", "recipe"],
  ["Snack", "recipe"],
  ["Dessert", "recipe"],
  ["Vegetables", "food"],
  ["Fruits", "food"],
  ["Grains", "food"],
  ["Legumes", "food"],
  ["Nuts & Seeds", "food"],
]);
const ALLERGENS = ["Peanuts", "Tree Nuts", "Soy", "Wheat", "Sesame"];
const PREPARATION_WORDS = new Set([
  "fresh",
  "dried",
  "ground",
  "large",
  "small",
  "medium",
  "finely",
  "roughly",
  "thinly",
  "chopped",
  "sliced",
  "diced",
  "minced",
  "peeled",
  "crushed",
  "optional",
  "whole",
  "raw",
]);

const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 220);
const singularize = (word) => {
  if (word === "peppercorns") return "pepper";
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
};
const tokenize = (value, { keepParenthetical = false } = {}) =>
  String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\(([^)]*)\)/g, keepParenthetical ? " $1 " : " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1 && !PREPARATION_WORDS.has(word))
    .map(singularize);
const words = (value) => tokenize(String(value).split(/\bor\b|,|;|\//)[0]);
const ingredientCategory = (role) =>
  /fruit|citrus|sweetener/i.test(role)
    ? "Fruits"
    : /grain|starch|flour|pasta|noodle|rice/i.test(role)
      ? "Grains"
      : /protein|legume/i.test(role)
        ? "Legumes"
        : /nut|seed|fat/i.test(role)
          ? "Nuts & Seeds"
          : "Vegetables";

export function createFoodMatcher(foods) {
  const candidates = foods.map((food) => ({
    food,
    tokens: new Set(
      [food.name, ...(food.aliases ?? [])].flatMap((value) =>
        tokenize(value, { keepParenthetical: true }),
      ),
    ),
  }));
  const findBest = (query, pool) => {
    let best = null;
    let bestScore = 0;
    for (const candidate of pool) {
      const matches = [...query].filter((token) => candidate.tokens.has(token)).length;
      const score = matches / query.size + matches / Math.max(candidate.tokens.size, 1);
      if (matches && score > bestScore) {
        best = candidate.food;
        bestScore = score;
      }
    }
    return bestScore >= 0.7 ? best : null;
  };
  return (name) => {
    const query = new Set(words(name));
    if (!query.size) return null;
    return (
      findBest(
        query,
        candidates.filter((candidate) => candidate.food.nutritionDataQuality === "verified"),
      ) ?? findBest(query, candidates)
    );
  };
}

const upsertOwned = async (model, filter, values, provider) => {
  const existing = await model.findOne(filter).lean();
  if (existing && existing.sourceAttribution?.provider !== provider)
    throw new Error(`Catalog slug conflicts with non-catalog record: ${JSON.stringify(filter)}`);
  await model.updateOne(filter, { $set: values }, { upsert: true, runValidators: true });
  return model.findOne(filter).lean();
};

export async function importOpenCatalog(container, catalog) {
  const { models, logger } = container;
  const required = ["users", "categories", "allergens", "foodItems", "recipes"];
  for (const key of required) if (!models[key]) throw new Error(`Missing container model: ${key}`);

  const author = await models.users.findOneAndUpdate(
    { firebaseUid: AUTHOR_UID },
    {
      $set: {
        firebaseUid: AUTHOR_UID,
        email: AUTHOR_EMAIL,
        displayName: "Open Catalog",
        role: "admin",
        status: "active",
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
  const categories = new Map();
  for (const [name, type] of CATEGORY_TYPES) {
    const category = await models.categories.findOneAndUpdate(
      { slug: slug(name) },
      { $setOnInsert: { name, slug: slug(name), type, status: "active", sortOrder: 100 } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    categories.set(name, category._id);
  }
  const allergens = new Map();
  for (const name of ALLERGENS) {
    const allergen = await models.allergens.findOneAndUpdate(
      { slug: slug(name) },
      { $setOnInsert: { name, slug: slug(name), status: "active" } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    allergens.set(name, allergen._id);
  }

  const counters = { foods: 0, placeholderFoods: 0, recipes: 0 };
  for (let index = 0; index < catalog.foods.length; index += 20) {
    const batch = catalog.foods.slice(index, index + 20);
    await Promise.all(
      batch.map(async (food) => {
        const { category, allergenNames, sourceSlug, ...values } = food;
        await upsertOwned(
          models.foodItems,
          { slug: sourceSlug },
          {
            ...values,
            slug: sourceSlug,
            categoryId: categories.get(category),
            allergenIds: allergenNames.map((name) => allergens.get(name)).filter(Boolean),
            nutritionPer100g: normalizeNutrition(values.nutritionPer100g),
          },
          "USDA FoodData Central",
        );
      }),
    );
    counters.foods += batch.length;
  }

  let canonicalFoods = await models.foodItems.find({ status: "active", isVegan: true }).lean();
  let matchFood = createFoodMatcher(canonicalFoods);
  for (const recipe of catalog.recipes) {
    const resolved = [];
    for (const ingredient of recipe.ingredients) {
      let food = matchFood(ingredient.name);
      if (!food) {
        const fingerprint = createHash("sha256").update(ingredient.name).digest("hex").slice(0, 16);
        const placeholderSlug = `forkrecipe-ingredient-${slug(ingredient.name).slice(0, 100)}-${fingerprint}`;
        food = await upsertOwned(
          models.foodItems,
          { slug: placeholderSlug },
          {
            name: ingredient.name,
            normalizedName: ingredient.name.normalize("NFKC").toLowerCase(),
            slug: placeholderSlug,
            aliases: [],
            categoryId: categories.get(ingredientCategory(ingredient.role)),
            defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
            nutritionPer100g: normalizeNutrition({}),
            nutritionDataQuality: "unavailable",
            allergenIds: inferAllergens(ingredient.name)
              .map((name) => allergens.get(name))
              .filter(Boolean),
            isVegan: true,
            isVegetarian: true,
            status: "active",
            sourceAttribution: {
              ...recipe.sourceAttribution,
              sourceId: `${recipe.sourceId}:ingredient:${fingerprint}`,
            },
          },
          "ForkRecipe",
        );
        canonicalFoods.push(food);
        matchFood = createFoodMatcher(canonicalFoods);
        counters.placeholderFoods += 1;
      }
      resolved.push({
        foodItemId: food._id,
        foodNameSnapshot: food.name,
        nutritionPer100g: normalizeNutrition(food.nutritionPer100g),
        allergenIds: [...(food.allergenIds ?? [])],
        isVegan: true,
        isVegetarian: true,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        gramEquivalent: ingredient.gramEquivalent,
        optional: ingredient.optional,
        order: ingredient.order,
      });
    }
    const verifiedNutrition = resolved.every((item) => {
      const food = canonicalFoods.find(
        (candidate) => String(candidate._id) === String(item.foodItemId),
      );
      return food?.nutritionDataQuality === "verified";
    });
    const { category, sourceSlug, sourceId: _sourceId, ...values } = recipe;
    const nutritionPerServing = verifiedNutrition
      ? calculateRecipeNutrition(resolved, { servings: recipe.servings })
      : normalizeNutrition({});
    await upsertOwned(
      models.recipes,
      { slug: sourceSlug },
      {
        ...values,
        slug: sourceSlug,
        authorId: author._id,
        sourceType: "admin",
        status: "published",
        visibility: "public",
        categoryIds: [categories.get(category)],
        ingredients: resolved,
        nutritionPerServing,
        nutritionDataQuality: verifiedNutrition ? "verified" : "unavailable",
        allergenIds: [
          ...new Map(
            resolved.flatMap((item) => item.allergenIds).map((id) => [String(id), id]),
          ).values(),
        ],
        isVegan: true,
        isVegetarian: true,
        publishedAt: new Date(recipe.sourceAttribution.importedAt),
        deletedAt: null,
      },
      "ForkRecipe",
    );
    counters.recipes += 1;
  }
  logger.info({ counters }, "Open catalog import finished; no records deleted");
  return counters;
}

export async function main(args = process.argv.slice(2)) {
  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  if (!args.includes("--apply")) {
    console.log(
      `Dry run: ${catalog.foods.length} USDA foods and ${catalog.recipes.length} vegan recipes are ready. Add --apply to upsert them.`,
    );
    return;
  }
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
    await importOpenCatalog(container, catalog);
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
