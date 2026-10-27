import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const USDA_SOURCE = Object.freeze({
  provider: "USDA FoodData Central",
  url: "https://fdc.nal.usda.gov/",
  license: "CC0-1.0",
});
export const FORK_RECIPE_SOURCE = Object.freeze({
  provider: "ForkRecipe",
  url: "https://github.com/futurechef/forkrecipe-recipes",
  license: "CC-BY-SA-4.0",
  revision: "934319313379201f91ddccdd29abd054039a3ad6",
});

const PLANT_CATEGORIES = new Map([
  ["Legumes and Legume Products", "Legumes"],
  ["Vegetables and Vegetable Products", "Vegetables"],
  ["Nut and Seed Products", "Nuts & Seeds"],
  ["Fruits and Fruit Juices", "Fruits"],
  ["Spices and Herbs", "Vegetables"],
  ["Cereal Grains and Pasta", "Grains"],
  ["Fats and Oils", "Nuts & Seeds"],
]);
const NUTRIENTS = Object.freeze({
  1008: "caloriesKcal",
  1003: "proteinG",
  1005: "carbsG",
  1004: "fatG",
  1079: "fiberG",
  2000: "sugarG",
  1063: "sugarG",
  1093: "sodiumMg",
  1087: "calciumMg",
  1089: "ironMg",
  1178: "vitaminB12Mcg",
  1114: "vitaminDMcg",
});
const ANIMAL_INGREDIENTS = [
  "beef",
  "pork",
  "chicken",
  "lamb",
  "veal",
  "fish",
  "salmon",
  "tuna",
  "anchovy",
  "anchovies",
  "shrimp",
  "prawn",
  "crab",
  "lobster",
  "egg",
  "milk",
  "cream",
  "butter",
  "ghee",
  "cheese",
  "yogurt",
  "honey",
  "gelatin",
  "gelatine",
  "worcestershire",
  "bacon",
  "lard",
  "oyster",
  "shellfish",
];
const animalPattern = new RegExp(`\\b(?:${ANIMAL_INGREDIENTS.join("|")})\\b`, "i");
const PLANT_BASED_EXCEPTIONS =
  /\b(?:coconut|soy|soya|almond|oat|rice|cashew|hemp|pea)\s+(?:milk|cream|yogurt)\b|\bvegan\s+(?:butter|cheese|cream|milk|yogurt)\b|\bplant[- ]based\s+(?:butter|cheese|cream|milk|yogurt)\b/gi;

const number = (value) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);
const compactText = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
const parseMinutes = (value) => number(String(value ?? "").match(/\d+(?:\.\d+)?/)?.[0]);

export function transformUsdaFoundation(payload, importedAt = new Date().toISOString()) {
  return (payload.FoundationFoods ?? payload.SRLegacyFoods ?? [])
    .filter(Boolean)
    .filter((food) => PLANT_CATEGORIES.has(food.foodCategory?.description))
    .filter((food) => !animalPattern.test(food.description))
    .map((food) => {
      const nutritionPer100g = {};
      for (const item of food.foodNutrients ?? []) {
        const key = NUTRIENTS[item.nutrient?.id];
        if (key && nutritionPer100g[key] === undefined) nutritionPer100g[key] = number(item.amount);
      }
      const description = compactText(food.description);
      return {
        name: description,
        normalizedName: description.normalize("NFKC").toLowerCase(),
        aliases: [...new Set([description.split(",")[0].trim()].filter(Boolean))],
        sourceSlug: `usda-fdc-${food.fdcId}`,
        category: PLANT_CATEGORIES.get(food.foodCategory.description),
        defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
        nutritionPer100g,
        nutritionDataQuality: "verified",
        allergenNames: inferAllergens(description),
        isVegan: true,
        isVegetarian: true,
        status: "active",
        sourceAttribution: {
          ...USDA_SOURCE,
          sourceId: String(food.fdcId),
          url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`,
          importedAt,
        },
      };
    });
}

export function inferAllergens(value) {
  const text = compactText(value).toLowerCase();
  const allergens = [];
  if (/peanut/.test(text)) allergens.push("Peanuts");
  if (/almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|brazil nut/.test(text))
    allergens.push("Tree Nuts");
  if (/soy|tofu|tempeh|edamame/.test(text)) allergens.push("Soy");
  if (/wheat|barley|rye|semolina|couscous|spelt/.test(text)) allergens.push("Wheat");
  if (/sesame|tahini/.test(text)) allergens.push("Sesame");
  return allergens;
}

const recipeCategory = (recipe) => {
  const text = [recipe.category, ...(recipe.tags ?? [])].join(" ").toLowerCase();
  if (/dessert|cake|cookie|pudding|sweet/.test(text)) return "Dessert";
  if (/breakfast|brunch/.test(text)) return "Breakfast";
  if (/snack|dip|drink|beverage|condiment|sauce|pickle/.test(text)) return "Snack";
  if (/soup|salad|lunch/.test(text)) return "Lunch";
  return "Dinner";
};
const normalizedUnit = (value) => {
  const unit = String(value ?? "g").toLowerCase();
  if (["g", "kg", "ml", "l", "tbsp", "tsp", "cup"].includes(unit)) return unit;
  if (/tablespoon/.test(unit)) return "tbsp";
  if (/teaspoon/.test(unit)) return "tsp";
  if (/cup/.test(unit)) return "cup";
  return "piece";
};
const gramEquivalent = (amount, unit) =>
  number(amount) * ({ kg: 1000, l: 1000, ml: 1, tbsp: 15, tsp: 5, cup: 240, piece: 50 }[unit] ?? 1);

export function transformForkRecipe(recipe, importedAt = new Date().toISOString()) {
  const tags = (recipe.tags ?? []).map((tag) => String(tag).toLowerCase());
  if (!tags.includes("vegan")) return null;
  const ingredientText = JSON.stringify(recipe.ingredients ?? [])
    .toLowerCase()
    .replace(PLANT_BASED_EXCEPTIONS, "");
  if (animalPattern.test(ingredientText)) return null;
  if (!recipe.ingredients?.length || !recipe.processNodes?.length) return null;
  const ingredients = recipe.ingredients.map((ingredient, order) => {
    const unit = normalizedUnit(ingredient.defaultUnit);
    const quantity = Math.max(0.000001, number(ingredient.ratioValue) || 1);
    return {
      name: compactText(ingredient.name),
      role: compactText(ingredient.role),
      quantity,
      unit,
      gramEquivalent: Math.max(0.000001, gramEquivalent(quantity, unit)),
      optional: /optional/i.test(ingredient.name),
      order: order + 1,
    };
  });
  return {
    sourceSlug: `forkrecipe-${recipe.slug}`,
    sourceId: recipe.repoId || recipe.slug,
    title: compactText(recipe.title),
    summary: compactText(recipe.description).slice(0, 1000),
    description: compactText(recipe.description).slice(0, 10000),
    cuisine: compactText(recipe.cuisine).slice(0, 100),
    category: recipeCategory(recipe),
    tags: [...new Set([...tags, "open-catalog", "vegan"])].slice(0, 30),
    difficulty:
      number(recipe.difficulty) >= 4 ? "hard" : number(recipe.difficulty) >= 2 ? "medium" : "easy",
    prepMinutes: parseMinutes(recipe.activeTime),
    totalMinutes: parseMinutes(recipe.totalTime),
    servings: 4,
    ingredients,
    steps: recipe.processNodes.map((step, index) => ({
      order: index + 1,
      instruction: compactText(step.instructions).slice(0, 5000),
    })),
    sourceAttribution: {
      ...FORK_RECIPE_SOURCE,
      sourceId: recipe.repoId || recipe.slug,
      url: `${FORK_RECIPE_SOURCE.url}/blob/${FORK_RECIPE_SOURCE.revision}/recipes/${recipe.slug}.js`,
      importedAt,
    },
  };
}

export async function loadForkRecipes(directory, importedAt = new Date().toISOString()) {
  const files = (await fs.readdir(path.join(directory, "recipes"))).filter(
    (file) => file.endsWith(".js") && file !== "index.js",
  );
  const recipes = [];
  for (const file of files) {
    const module = await import(`${pathToFileURL(path.join(directory, "recipes", file)).href}?v=1`);
    const recipe = transformForkRecipe(module.default, importedAt);
    if (recipe) recipes.push(recipe);
  }
  return recipes;
}

export async function buildOpenCatalog({
  usdaPath,
  usdaPaths = [usdaPath],
  forkRecipeDirectory,
  outputPath,
  importedAt,
}) {
  const timestamp = importedAt ?? new Date().toISOString();
  const foods = [];
  for (const sourcePath of usdaPaths) {
    const usda = JSON.parse(await fs.readFile(sourcePath, "utf8"));
    foods.push(...transformUsdaFoundation(usda, timestamp));
  }
  const catalog = {
    generatedAt: timestamp,
    sources: [USDA_SOURCE, FORK_RECIPE_SOURCE],
    foods: [...new Map(foods.map((food) => [food.sourceSlug, food])).values()],
    recipes: await loadForkRecipes(forkRecipeDirectory, timestamp),
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
}

function args(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) parsed[values[index]] = values[index + 1];
  return parsed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = args(process.argv.slice(2));
  if (!options["--usda"] || !options["--forkrecipe"] || !options["--output"])
    throw new Error(
      "Usage: build-open-catalog --usda <foundation.json> --forkrecipe <dir> --output <json>",
    );
  const catalog = await buildOpenCatalog({
    usdaPaths: options["--usda"].split(path.delimiter),
    forkRecipeDirectory: options["--forkrecipe"],
    outputPath: options["--output"],
  });
  console.log(`Built ${catalog.foods.length} foods and ${catalog.recipes.length} vegan recipes.`);
}
