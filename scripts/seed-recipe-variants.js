import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { calculateRecipeNutrition, normalizeCalories } from "../src/common/utils/nutrition.js";

const PROFILES = [
  {
    id: "vn",
    name: "Phiên bản cảm hứng Việt Nam",
    region: "Việt Nam",
    countryCode: "VN",
    garnishSlug: "lime",
    quantity: 15,
    note: "Thêm chanh xanh để tạo hương vị Việt Nam",
  },
  {
    id: "med",
    name: "Phiên bản cảm hứng Địa Trung Hải",
    region: "Địa Trung Hải",
    countryCode: "GR",
    garnishSlug: "tomato",
    quantity: 50,
    note: "Thêm cà chua để tạo hương vị Địa Trung Hải",
  },
  {
    id: "latam",
    name: "Phiên bản cảm hứng Mỹ Latinh",
    region: "Mỹ Latinh",
    countryCode: "MX",
    garnishSlug: "corn",
    quantity: 50,
    note: "Thêm ngô để tạo hương vị Mỹ Latinh",
  },
];

export function stableVariantId(recipeSlug, profileId) {
  const bytes = Buffer.from(
    createHash("sha256")
      .update(`catalog-variant:${recipeSlug}:${profileId}`)
      .digest()
      .subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generatedVariant(recipe, profile, food) {
  const base = (recipe.ingredients ?? []).map((ingredient) => ({ ...ingredient }));
  const alreadyIncluded = base.some(
    (ingredient) => String(ingredient.foodItemId) === String(food._id),
  );
  const ingredients = alreadyIncluded
    ? base
    : [
        ...base,
        {
          foodItemId: food._id,
          foodNameSnapshot: food.name,
          nutritionPer100g: food.nutritionPer100g,
          allergenIds: food.allergenIds ?? [],
          isVegan: true,
          isVegetarian: true,
          containsEggs: false,
          containsDairy: false,
          quantity: profile.quantity,
          unit: "g",
          gramEquivalent: profile.quantity,
          note: profile.note,
          optional: true,
          order: base.length + 1,
        },
      ];
  const calories = normalizeCalories(
    calculateRecipeNutrition(ingredients, { servings: recipe.servings || 1 }),
  );
  return {
    variantId: stableVariantId(recipe.slug, profile.id),
    name: profile.name,
    region: profile.region,
    countryCode: profile.countryCode,
    servings: recipe.servings || 1,
    ingredients,
    nutritionPerServing: calories.nutrition,
    allergenIds: [
      ...new Map(
        ingredients
          .flatMap((ingredient) => ingredient.allergenIds ?? [])
          .map((id) => [String(id), id]),
      ).values(),
    ],
    isDefault: false,
  };
}

export async function seedRecipeVariants(database, { apply = false } = {}) {
  const recipes = await database
    .collection("recipes")
    .find({ status: { $ne: "deleted" }, deletedAt: null })
    .toArray();
  const foods = await database
    .collection("fooditems")
    .find({ slug: { $in: PROFILES.map((profile) => profile.garnishSlug) } })
    .toArray();
  const foodsBySlug = new Map(foods.map((food) => [food.slug, food]));
  for (const profile of PROFILES)
    if (!foodsBySlug.has(profile.garnishSlug))
      throw new Error(`Missing regional variant ingredient: ${profile.garnishSlug}`);

  const operations = [];
  let variantsAdded = 0;
  for (const recipe of recipes) {
    const variants = [...(recipe.variants ?? [])];
    if (variants.length >= PROFILES.length) continue;
    const represented = new Set(variants.map((variant) => variant.countryCode));
    for (const profile of PROFILES) {
      if (variants.length >= PROFILES.length || represented.has(profile.countryCode)) continue;
      variants.push(generatedVariant(recipe, profile, foodsBySlug.get(profile.garnishSlug)));
      represented.add(profile.countryCode);
      variantsAdded += 1;
    }
    operations.push({
      updateOne: {
        filter: { _id: recipe._id },
        update: { $set: { variants, updatedAt: new Date() } },
      },
    });
  }
  const result =
    apply && operations.length
      ? await database.collection("recipes").bulkWrite(operations, { ordered: false })
      : null;
  return {
    mode: apply ? "apply" : "dry-run",
    recipes: recipes.length,
    recipesNeedingVariants: operations.length,
    variantsBefore: recipes.reduce((total, recipe) => total + (recipe.variants?.length ?? 0), 0),
    variantsAdded,
    variantsAfter:
      recipes.reduce((total, recipe) => total + (recipe.variants?.length ?? 0), 0) + variantsAdded,
    recipesModified: result?.modifiedCount ?? 0,
  };
}

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  try {
    await connectDatabase({ ...env.database, logger });
    console.log(
      JSON.stringify(
        await seedRecipeVariants(mongoose.connection.db, {
          apply: process.argv.includes("--apply"),
        }),
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
