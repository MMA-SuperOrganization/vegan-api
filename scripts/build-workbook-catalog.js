import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  normalizeCalories,
  normalizeNutrition,
  calculateRecipeNutrition,
} from "../src/common/utils/nutrition.js";
import { readXlsxRows, rowsToObjects } from "./lib/xlsx-rows.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_WORKBOOK = path.resolve(
  SCRIPT_DIR,
  "../../outputs/vegeta-seed-catalog-20261103/vegeta_seed_catalog.xlsx",
);
export const DEFAULT_OUTPUT = path.join(SCRIPT_DIR, "catalog-data/vegeta-workbook-catalog.json");
const OPEN_CATALOG = path.join(SCRIPT_DIR, "catalog-data/open-catalog.json");
const NUTRIENT_KEYS = [
  "caloriesKcal",
  "proteinG",
  "carbsG",
  "fatG",
  "fiberG",
  "sugarG",
  "sodiumMg",
  "calciumMg",
  "ironMg",
  "vitaminB12Mcg",
  "vitaminDMcg",
];

const split = (value) =>
  String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
const key = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\b(?:raw|cooked|boiled|fresh|commercial|unsalted|unprepared)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const tokens = (value) =>
  new Set(
    key(value)
      .split(" ")
      .filter((token) => token.length > 1),
  );
const stableUuid = (value) => {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const nutritionFrom = (row) =>
  normalizeNutrition(
    Object.fromEntries(NUTRIENT_KEYS.map((name) => [name, Number(row[name] ?? 0)])),
  );
const ids = (value) => split(value);
const assertUnique = (rows, field, label) => {
  const seen = new Set();
  for (const row of rows) {
    const value = String(row[field] ?? "");
    if (!value || seen.has(value))
      throw new Error(`${label} has a missing or duplicate ${field}: ${value}`);
    seen.add(value);
  }
};
const assertReferences = (rows, field, allowed, label) => {
  for (const row of rows)
    for (const value of ids(row[field]))
      if (!allowed.has(value)) throw new Error(`${label} references unknown ${field}: ${value}`);
};

function findUsdaFood(food, openFoods) {
  const wanted = tokens([food.name, ...food.aliases].join(" "));
  let best = null;
  let bestScore = 0;
  for (const candidate of openFoods) {
    if (candidate.category !== food.categoryName) continue;
    const names = [candidate.name, ...(candidate.aliases ?? [])];
    for (const name of names) {
      const candidateTokens = tokens(name);
      const overlap = [...wanted].filter((token) => candidateTokens.has(token)).length;
      if (!overlap) continue;
      const score = overlap / wanted.size + overlap / candidateTokens.size;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  return bestScore >= 1 ? best : null;
}

const VARIANT_PROFILES = [
  {
    id: "vn",
    name: "Vietnam-inspired",
    region: "Việt Nam",
    countryCode: "VN",
    targets: {
      Grains: ["Rice Noodles", "Brown Rice"],
      Legumes: ["Tofu", "Tempeh"],
      "Nuts & Seeds": ["Sesame Seeds", "Cashews"],
      Vegetables: ["Mushroom", "Spinach"],
      Fruits: ["Lime", "Banana"],
    },
  },
  {
    id: "med",
    name: "Mediterranean-inspired",
    region: "Địa Trung Hải",
    countryCode: "GR",
    targets: {
      Grains: ["Whole Wheat Pasta", "Quinoa"],
      Legumes: ["Chickpeas", "Lentils"],
      "Nuts & Seeds": ["Walnuts", "Almonds"],
      Vegetables: ["Tomato", "Zucchini"],
      Fruits: ["Orange", "Lime"],
    },
  },
  {
    id: "latam",
    name: "Latin America-inspired",
    region: "Mỹ Latinh",
    countryCode: "MX",
    targets: {
      Grains: ["Corn", "Quinoa"],
      Legumes: ["Black Beans", "Kidney Beans"],
      "Nuts & Seeds": ["Chia Seeds", "Flaxseeds"],
      Vegetables: ["Bell Pepper", "Avocado"],
      Fruits: ["Lime", "Orange"],
    },
  },
];

function buildVariants(recipe, foodsById, foodsByName) {
  return VARIANT_PROFILES.map((profile) => {
    let replacements = 0;
    const used = new Set(recipe.ingredients.map((item) => String(item.foodItemId)));
    const ingredients = recipe.ingredients.map((ingredient) => {
      if (replacements >= 2) return ingredient;
      const source = foodsById.get(String(ingredient.foodItemId));
      const target = (profile.targets[source.categoryName] ?? [])
        .map((name) => foodsByName.get(key(name)))
        .find(
          (food) => food && !used.has(food.workbookId) && food.workbookId !== source.workbookId,
        );
      if (!target) return ingredient;
      replacements += 1;
      used.add(target.workbookId);
      return {
        ...ingredient,
        foodItemId: target.workbookId,
        foodNameSnapshot: target.name,
        nutritionPer100g: target.nutritionPer100g,
        allergenIds: target.allergenIds,
        note: `Regional substitution for ${source.name}`,
      };
    });
    if (!replacements) return null;
    const calories = normalizeCalories(
      calculateRecipeNutrition(ingredients, { servings: recipe.servings }),
    );
    return {
      variantId: stableUuid(`${recipe.workbookId}:${profile.id}`),
      name: profile.name,
      region: profile.region,
      countryCode: profile.countryCode,
      servings: recipe.servings,
      ingredients,
      nutritionPerServing: calories.nutrition,
      nutritionCalculation: calories.calculation,
      allergenIds: [...new Set(ingredients.flatMap((item) => item.allergenIds))],
      isDefault: false,
    };
  }).filter(Boolean);
}

export async function buildWorkbookCatalog({ inputPath, outputPath, importedAt } = {}) {
  const workbookPath = path.resolve(inputPath ?? DEFAULT_WORKBOOK);
  const sheets = await readXlsxRows(workbookPath);
  const rows = {
    foods: rowsToObjects(sheets.get("Nguyên liệu") ?? [], "_id"),
    recipes: rowsToObjects(sheets.get("Công thức") ?? [], "_id"),
    recipeIngredients: rowsToObjects(sheets.get("CT - Nguyên liệu") ?? [], "recipeId"),
    steps: rowsToObjects(sheets.get("Các bước nấu") ?? [], "recipeId"),
    posts: rowsToObjects(sheets.get("Bài post") ?? [], "_id"),
    categories: rowsToObjects(sheets.get("Categories") ?? [], "_id"),
    allergens: rowsToObjects(sheets.get("Allergens") ?? [], "_id"),
  };
  assertUnique(rows.foods, "_id", "Foods");
  assertUnique(rows.recipes, "_id", "Recipes");
  assertUnique(rows.posts, "_id", "Posts");
  assertUnique(rows.categories, "_id", "Categories");
  assertUnique(rows.allergens, "_id", "Allergens");
  const foodIds = new Set(rows.foods.map((row) => String(row._id)));
  const recipeIds = new Set(rows.recipes.map((row) => String(row._id)));
  const categoryIds = new Set(rows.categories.map((row) => String(row._id)));
  const allergenIds = new Set(rows.allergens.map((row) => String(row._id)));
  assertReferences(rows.foods, "categoryId", categoryIds, "Foods");
  assertReferences(rows.foods, "allergenIds", allergenIds, "Foods");
  assertReferences(rows.recipes, "categoryIds", categoryIds, "Recipes");
  assertReferences(rows.recipes, "allergenIds", allergenIds, "Recipes");
  assertReferences(rows.recipeIngredients, "foodItemId", foodIds, "Recipe ingredients");
  assertReferences(rows.recipeIngredients, "recipeId", recipeIds, "Recipe ingredients");
  assertReferences(rows.steps, "recipeId", recipeIds, "Steps");

  const openCatalog = JSON.parse(await fs.readFile(OPEN_CATALOG, "utf8"));
  const timestamp = importedAt ?? new Date().toISOString();
  const foods = rows.foods.map((row) => {
    const base = {
      workbookId: String(row._id),
      name: String(row.name),
      normalizedName: String(row.normalizedName || row.name)
        .normalize("NFKC")
        .toLowerCase(),
      slug: `vegeta-workbook-${String(row.normalizedName || row.name)
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}`,
      aliases: split(row.aliases),
      description: row.description || undefined,
      categoryId: String(row.categoryId),
      categoryName: String(row.categoryName),
      imageUrl: row.imageUrl || undefined,
      defaultServing: {
        amount: Number(row.servingAmount),
        unit: String(row.servingUnit),
        gramEquivalent: Number(row.gramEquivalent),
      },
      nutritionPer100g: nutritionFrom(row),
      nutritionDataQuality: "estimated",
      allergenIds: ids(row.allergenIds),
      isVegan: row.isVegan === true,
      isVegetarian: row.isVegetarian === true,
      status: String(row.status || "active"),
      sourceAttribution: {
        provider: "VEGETA seed workbook",
        sourceId: String(row._id),
        license: "project-internal",
        importedAt: timestamp,
      },
    };
    const usda = findUsdaFood(base, openCatalog.foods);
    return usda
      ? {
          ...base,
          nutritionPer100g: normalizeNutrition(usda.nutritionPer100g),
          nutritionDataQuality: "verified",
          sourceAttribution: usda.sourceAttribution,
        }
      : base;
  });
  const foodsById = new Map(foods.map((food) => [food.workbookId, food]));
  const foodsByName = new Map(foods.map((food) => [key(food.name), food]));
  const recipes = rows.recipes.map((row) => {
    const ingredients = rows.recipeIngredients
      .filter((item) => String(item.recipeId) === String(row._id))
      .sort((left, right) => Number(left.order) - Number(right.order))
      .map((item) => {
        const food = foodsById.get(String(item.foodItemId));
        return {
          foodItemId: food.workbookId,
          foodNameSnapshot: food.name,
          nutritionPer100g: food.nutritionPer100g,
          allergenIds: food.allergenIds,
          isVegan: food.isVegan,
          isVegetarian: food.isVegetarian,
          quantity: Number(item.quantity),
          unit: String(item.unit),
          gramEquivalent: Number(item.gramEquivalent),
          optional: item.optional === true,
          order: Number(item.order),
        };
      });
    if (!ingredients.length) throw new Error(`Recipe ${row._id} has no ingredients`);
    const calculated = normalizeCalories(
      calculateRecipeNutrition(ingredients, { servings: Number(row.servings) }),
    );
    const recipe = {
      workbookId: String(row._id),
      title: String(row.title),
      slug: `vegeta-workbook-${row.slug}`,
      coverImageUrl: row.coverImageUrl || undefined,
      categoryIds: ids(row.categoryIds),
      difficulty: String(row.difficulty),
      prepMinutes: Number(row.prepMinutes),
      cookMinutes: Number(row.cookMinutes),
      totalMinutes: Number(row.totalMinutes),
      servings: Number(row.servings),
      summary: String(row.summary || ""),
      description: row.description || undefined,
      cuisine: row.cuisine || undefined,
      tags: [...new Set([...split(row.tags), "workbook-seed", "regional-variants"])],
      allergenIds: [...new Set(ingredients.flatMap((item) => item.allergenIds))],
      isVegan: ingredients.every((item) => item.isVegan),
      isVegetarian: ingredients.every((item) => item.isVegetarian),
      nutritionPerServing: calculated.nutrition,
      nutritionCalculation: calculated.calculation,
      nutritionDataQuality: ingredients.every(
        (item) => foodsById.get(item.foodItemId).nutritionDataQuality === "verified",
      )
        ? "verified"
        : "estimated",
      status: "published",
      visibility: "public",
      ingredients,
      steps: rows.steps
        .filter((item) => String(item.recipeId) === String(row._id))
        .sort((left, right) => Number(left.order) - Number(right.order))
        .map((item) => ({
          order: Number(item.order),
          instruction: String(item.instruction),
          ...(item.timerSeconds == null ? {} : { timerSeconds: Number(item.timerSeconds) }),
        })),
      sourceAttribution: {
        provider: "VEGETA seed workbook",
        sourceId: String(row._id),
        license: "project-internal",
        importedAt: timestamp,
      },
      publishedAt: new Date(row.publishedAt || timestamp).toISOString(),
    };
    recipe.variants = buildVariants(recipe, foodsById, foodsByName);
    return recipe;
  });
  const catalog = {
    version: 1,
    generatedAt: timestamp,
    sourceWorkbook: path.basename(workbookPath),
    categories: rows.categories,
    allergens: rows.allergens,
    foods,
    recipes,
    posts: rows.posts,
    stats: {
      categories: rows.categories.length,
      allergens: rows.allergens.length,
      foods: foods.length,
      verifiedFoods: foods.filter((food) => food.nutritionDataQuality === "verified").length,
      recipes: recipes.length,
      variants: recipes.reduce((sum, recipe) => sum + recipe.variants.length, 0),
      posts: rows.posts.length,
    },
  };
  if (outputPath !== null) {
    const target = path.resolve(outputPath ?? DEFAULT_OUTPUT);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }
  return catalog;
}

function argumentsMap(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value.startsWith("--") && values[index + 1] && !values[index + 1].startsWith("--"))
      result[value] = values[++index];
    else result[value] = true;
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = argumentsMap(process.argv.slice(2));
  const catalog = await buildWorkbookCatalog({
    inputPath: args["--input"],
    outputPath: args["--output"],
    importedAt: args["--imported-at"],
  });
  console.log(JSON.stringify(catalog.stats));
}
