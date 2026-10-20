import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";

/** Read-only catalog check. Never seeds, updates indexes, or rewrites application data. */
export async function verifySprint2Seed(db) {
  const names = ["foodItems", "recipes", "categories", "allergens"];
  const collections = ["fooditems", "recipes", "categories", "allergens"];
  const rows = await Promise.all(collections.map((name) => db.collection(name).find({}).toArray()));
  const catalog = Object.fromEntries(names.map((name, index) => [name, rows[index]]));
  const problems = [];
  for (const name of names) if (!catalog[name].length) problems.push(`${name}: empty collection`);
  const categoryIds = new Set(catalog.categories.map((row) => String(row._id)));
  const allergenIds = new Set(catalog.allergens.map((row) => String(row._id)));
  const foodIds = new Set(catalog.foodItems.map((row) => String(row._id)));
  for (const food of catalog.foodItems) {
    if (!food.categoryId || !categoryIds.has(String(food.categoryId)))
      problems.push(`food ${food._id}: missing category`);
    for (const id of food.allergenIds ?? [])
      if (!allergenIds.has(String(id))) problems.push(`food ${food._id}: missing allergen ${id}`);
    if (!food.nutritionPer100g) problems.push(`food ${food._id}: missing nutrition`);
  }
  const published = catalog.recipes.filter(
    (recipe) => recipe.status === "published" && !recipe.deletedAt,
  );
  if (!published.length) problems.push("recipes: no published recipes");
  for (const recipe of published) {
    if (!(recipe.servings > 0) || !recipe.ingredients?.length)
      problems.push(`recipe ${recipe._id}: missing servings/ingredients`);
    for (const ingredient of recipe.ingredients ?? [])
      if (!foodIds.has(String(ingredient.foodItemId)))
        problems.push(`recipe ${recipe._id}: missing food ${ingredient.foodItemId}`);
    for (const key of ["caloriesKcal", "proteinG", "carbsG", "fatG"]) {
      if (!Number.isFinite(recipe.nutritionPerServing?.[key]))
        problems.push(`recipe ${recipe._id}: missing ${key}`);
    }
  }
  return {
    passed: problems.length === 0,
    counts: Object.fromEntries(names.map((name) => [name, catalog[name].length])),
    publishedRecipes: published.length,
    problems,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const env = loadEnv();
    await mongoose.connect(env.database.uri, {
      dbName: env.database.dbName,
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 10000,
    });
    const result = await verifySprint2Seed(mongoose.connection.db);
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  } catch {
    console.error(
      "Catalog verification failed. Check database connectivity and local configuration.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
