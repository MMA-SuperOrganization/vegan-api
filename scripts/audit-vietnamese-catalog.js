import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { hasVietnamese, readTranslations, translationKey } from "./lib/vietnamese-catalog.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TRANSLATIONS = path.join(
  SCRIPT_DIR,
  "catalog-data/vietnamese-catalog-translations.json",
);

export async function auditVietnameseCatalog(database, catalog = { translations: {} }) {
  const [foods, recipes] = await Promise.all([
    database
      .collection("fooditems")
      .find({ status: { $ne: "inactive" } })
      .project({ name: 1, slug: 1, sourceAttribution: 1 })
      .toArray(),
    database
      .collection("recipes")
      .find({ status: { $ne: "deleted" }, deletedAt: null })
      .project({
        title: 1,
        slug: 1,
        ingredients: 1,
        variants: 1,
        sourceAttribution: 1,
        sourceType: 1,
      })
      .toArray(),
  ]);
  const translations = catalog.translations ?? {};
  const expected = (key) => translations[key]?.vi;
  const foodNames = new Map(foods.map((food) => [String(food._id), food.name]));
  const foodMismatches = foods.filter((food) => {
    const name = expected(translationKey.food(food));
    return name && food.name !== name;
  });
  const recipeMismatches = recipes.filter((recipe) => {
    const title = expected(translationKey.recipe(recipe));
    return title && recipe.title !== title;
  });
  const variants = recipes.flatMap((recipe) =>
    (recipe.variants ?? []).map((variant) => ({
      recipe,
      variant,
      expected: expected(translationKey.variant(recipe, variant)),
    })),
  );
  const variantMismatches = variants.filter(
    ({ variant, expected: name }) => name && variant.name !== name,
  );
  const ingredientSnapshots = recipes.flatMap((recipe) => [
    ...(recipe.ingredients ?? []),
    ...(recipe.variants ?? []).flatMap((variant) => variant.ingredients ?? []),
  ]);
  const snapshotMismatches = ingredientSnapshots.filter(
    (ingredient) =>
      foodNames.has(String(ingredient.foodItemId)) &&
      foodNames.get(String(ingredient.foodItemId)) !== ingredient.foodNameSnapshot,
  );
  const providerCounts = (records) =>
    Object.fromEntries(
      [...new Set(records.map((record) => record.sourceAttribution?.provider ?? "unattributed"))]
        .sort()
        .map((provider) => [
          provider,
          records.filter(
            (record) => (record.sourceAttribution?.provider ?? "unattributed") === provider,
          ).length,
        ]),
    );
  return {
    foods: {
      total: foods.length,
      translatedFromDictionary: foods.filter((food) => expected(translationKey.food(food))).length,
      alreadyVietnamese: foods.filter(
        (food) => !expected(translationKey.food(food)) && hasVietnamese(food.name),
      ).length,
      mismatches: foodMismatches.length,
      providers: providerCounts(foods),
      mismatchSamples: foodMismatches.slice(0, 20).map((food) => food.name),
    },
    recipes: {
      total: recipes.length,
      translatedFromDictionary: recipes.filter((recipe) => expected(translationKey.recipe(recipe)))
        .length,
      alreadyVietnamese: recipes.filter(
        (recipe) => !expected(translationKey.recipe(recipe)) && hasVietnamese(recipe.title),
      ).length,
      mismatches: recipeMismatches.length,
      providers: providerCounts(recipes),
      mismatchSamples: recipeMismatches.slice(0, 20).map((recipe) => recipe.title),
    },
    variants: {
      total: variants.length,
      translatedFromDictionary: variants.filter((variant) => variant.expected).length,
      generatedInVietnamese: variants.filter(
        ({ variant, expected: name }) => !name && hasVietnamese(variant.name),
      ).length,
      recipesWithVariants: recipes.filter((recipe) => (recipe.variants?.length ?? 0) > 0).length,
      recipesWithoutVariants: recipes.filter((recipe) => !(recipe.variants?.length ?? 0)).length,
      minimumPerRecipe: Math.min(...recipes.map((recipe) => recipe.variants?.length ?? 0)),
      mismatches: variantMismatches.length,
      mismatchSamples: variantMismatches
        .slice(0, 20)
        .map(({ recipe, variant }) => `${recipe.title}: ${variant.name}`),
    },
    ingredientSnapshots: {
      total: ingredientSnapshots.length,
      mismatches: snapshotMismatches.length,
    },
  };
}

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  const file = path.resolve(
    process.argv.find((arg) => arg.startsWith("--translations="))?.slice(15) ||
      DEFAULT_TRANSLATIONS,
  );
  try {
    await connectDatabase({ ...env.database, logger });
    console.log(
      JSON.stringify(
        await auditVietnameseCatalog(mongoose.connection.db, await readTranslations(file)),
        null,
        2,
      ),
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
