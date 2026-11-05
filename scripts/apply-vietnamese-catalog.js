import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import {
  normalizeCatalogName,
  readTranslations,
  translationKey,
} from "./lib/vietnamese-catalog.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TRANSLATIONS = path.join(
  SCRIPT_DIR,
  "catalog-data/vietnamese-catalog-translations.json",
);
const unique = (values) => [...new Set(values.filter(Boolean).map(normalizeCatalogName))];

function translatedName(translations, key, fallback) {
  const value = translations[key]?.vi;
  const translated = normalizeCatalogName(value);
  return translated || fallback;
}

function translateIngredients(ingredients, foodNames) {
  let changed = false;
  const translated = (ingredients ?? []).map((ingredient) => {
    const name = foodNames.get(String(ingredient.foodItemId));
    if (!name || name === ingredient.foodNameSnapshot) return ingredient;
    changed = true;
    return { ...ingredient, foodNameSnapshot: name };
  });
  return { changed, translated };
}

export async function applyVietnameseCatalog(database, catalog, { apply = false } = {}) {
  const translations = catalog.translations ?? {};
  const foods = await database
    .collection("fooditems")
    .find({ status: { $ne: "inactive" } })
    .project({ name: 1, slug: 1, aliases: 1 })
    .toArray();
  const foodNames = new Map();
  const foodOperations = [];
  for (const food of foods) {
    const name = translatedName(translations, translationKey.food(food), food.name);
    foodNames.set(String(food._id), name);
    if (name === food.name) continue;
    foodOperations.push({
      updateOne: {
        filter: { _id: food._id },
        update: {
          $set: { name, normalizedName: name.toLocaleLowerCase("vi"), updatedAt: new Date() },
          $addToSet: { aliases: { $each: unique([food.name, ...(food.aliases ?? [])]) } },
        },
      },
    });
  }

  const recipes = await database
    .collection("recipes")
    .find({ status: { $ne: "deleted" }, deletedAt: null })
    .toArray();
  const recipeNames = new Map();
  const recipeOperations = [];
  for (const recipe of recipes) {
    const title = translatedName(translations, translationKey.recipe(recipe), recipe.title);
    recipeNames.set(String(recipe._id), title);
    const base = translateIngredients(recipe.ingredients, foodNames);
    let variantChanged = false;
    const variants = (recipe.variants ?? []).map((variant) => {
      const name = translatedName(
        translations,
        translationKey.variant(recipe, variant),
        variant.name,
      );
      const ingredients = translateIngredients(variant.ingredients, foodNames);
      if (name !== variant.name || ingredients.changed) variantChanged = true;
      return { ...variant, name, ingredients: ingredients.translated };
    });
    if (title === recipe.title && !base.changed && !variantChanged) continue;
    recipeOperations.push({
      updateOne: {
        filter: { _id: recipe._id },
        update: {
          $set: {
            title,
            ingredients: base.translated,
            variants,
            updatedAt: new Date(),
          },
        },
      },
    });
  }

  const execute = async (collection, operations) =>
    apply && operations.length ? collection.bulkWrite(operations, { ordered: false }) : null;
  const [foodResult, recipeResult] = await Promise.all([
    execute(database.collection("fooditems"), foodOperations),
    execute(database.collection("recipes"), recipeOperations),
  ]);

  const snapshotOperations = { mealPlans: [], pantries: [], groceryLists: [], diary: [] };
  const [pantries, groceryLists, diaryEntries, mealPlans] = await Promise.all([
    database
      .collection("pantries")
      .find({ "items.foodItemId": { $exists: true } })
      .toArray(),
    database
      .collection("grocerylists")
      .find({ "items.foodItemId": { $exists: true } })
      .toArray(),
    database
      .collection("diaries")
      .find({ $or: [{ foodItemId: { $exists: true } }, { recipeId: { $exists: true } }] })
      .toArray(),
    database
      .collection("mealplans")
      .find({ "days.meals.recipeId": { $exists: true } })
      .toArray(),
  ]);
  for (const pantry of pantries) {
    const items = (pantry.items ?? []).map((item) => ({
      ...item,
      foodNameSnapshot: foodNames.get(String(item.foodItemId)) ?? item.foodNameSnapshot,
    }));
    if (JSON.stringify(items) !== JSON.stringify(pantry.items))
      snapshotOperations.pantries.push({
        updateOne: { filter: { _id: pantry._id }, update: { $set: { items } } },
      });
  }
  for (const list of groceryLists) {
    const items = (list.items ?? []).map((item) => ({
      ...item,
      nameSnapshot: foodNames.get(String(item.foodItemId)) ?? item.nameSnapshot,
    }));
    if (JSON.stringify(items) !== JSON.stringify(list.items))
      snapshotOperations.groceryLists.push({
        updateOne: { filter: { _id: list._id }, update: { $set: { items } } },
      });
  }
  for (const entry of diaryEntries) {
    const nameSnapshot =
      recipeNames.get(String(entry.recipeId)) ??
      foodNames.get(String(entry.foodItemId)) ??
      entry.nameSnapshot;
    if (nameSnapshot !== entry.nameSnapshot)
      snapshotOperations.diary.push({
        updateOne: { filter: { _id: entry._id }, update: { $set: { nameSnapshot } } },
      });
  }
  for (const plan of mealPlans) {
    const days = (plan.days ?? []).map((day) => ({
      ...day,
      meals: (day.meals ?? []).map((meal) => {
        const title = recipeNames.get(String(meal.recipeId)) ?? meal.recipeSnapshot?.title;
        const ingredients = translateIngredients(
          meal.recipeSnapshot?.ingredients,
          foodNames,
        ).translated;
        return {
          ...meal,
          recipeSnapshot: { ...meal.recipeSnapshot, title, ingredients },
        };
      }),
    }));
    if (JSON.stringify(days) !== JSON.stringify(plan.days))
      snapshotOperations.mealPlans.push({
        updateOne: { filter: { _id: plan._id }, update: { $set: { days } } },
      });
  }
  const snapshotCounts = {};
  for (const [key, operations] of Object.entries(snapshotOperations)) {
    const collection =
      key === "mealPlans"
        ? "mealplans"
        : key === "groceryLists"
          ? "grocerylists"
          : key === "diary"
            ? "diaries"
            : key;
    const result =
      apply && operations.length
        ? await database.collection(collection).bulkWrite(operations, { ordered: false })
        : null;
    snapshotCounts[key] = { pending: operations.length, modified: result?.modifiedCount ?? 0 };
  }
  return {
    mode: apply ? "apply" : "dry-run",
    foods: {
      total: foods.length,
      pending: foodOperations.length,
      modified: foodResult?.modifiedCount ?? 0,
    },
    recipes: {
      total: recipes.length,
      pending: recipeOperations.length,
      modified: recipeResult?.modifiedCount ?? 0,
    },
    variants: recipes.reduce((count, recipe) => count + (recipe.variants?.length ?? 0), 0),
    snapshotsModified: snapshotCounts,
  };
}

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  const apply = process.argv.includes("--apply");
  const file = path.resolve(
    process.argv.find((arg) => arg.startsWith("--translations="))?.slice(15) ||
      DEFAULT_TRANSLATIONS,
  );
  try {
    await connectDatabase({ ...env.database, logger });
    const catalog = await readTranslations(file);
    console.log(
      JSON.stringify(
        await applyVietnameseCatalog(mongoose.connection.db, catalog, { apply }),
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
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
