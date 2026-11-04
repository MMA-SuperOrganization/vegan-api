import fs from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CATALOG = path.join(SCRIPT_DIR, "catalog-data/vegeta-workbook-catalog.json");
const AUTHOR_UID = "internal:vegeta-workbook-catalog:v1";
const AUTHOR_EMAIL = "vegeta-workbook-catalog@example.invalid";
const PROVIDER = "VEGETA seed workbook";
const split = (value) =>
  String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
async function upsertOwned(model, filter, values) {
  const existing = await model.findOne(filter).lean();
  const expectedProvider = values.sourceAttribution?.provider ?? PROVIDER;
  if (
    existing?.sourceAttribution?.provider &&
    existing.sourceAttribution.provider !== expectedProvider
  )
    throw new Error(`Workbook catalog conflicts with another provider: ${JSON.stringify(filter)}`);
  await model.updateOne(filter, { $set: values }, { upsert: true, runValidators: true });
  return model.findOne(filter).lean();
}

export async function importWorkbookCatalog(container, catalog) {
  const { models, logger } = container;
  for (const key of ["users", "categories", "allergens", "foodItems", "recipes", "posts"])
    if (!models[key]) throw new Error(`Missing container model: ${key}`);
  const author = await models.users.findOneAndUpdate(
    { firebaseUid: AUTHOR_UID },
    {
      $set: {
        firebaseUid: AUTHOR_UID,
        email: AUTHOR_EMAIL,
        displayName: "VEGETA Workbook Catalog",
        role: "admin",
        status: "active",
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
  const categories = new Map();
  for (const row of catalog.categories) {
    const category = await models.categories.findOneAndUpdate(
      { slug: row.slug },
      {
        $set: {
          name: row.name,
          slug: row.slug,
          type: row.type,
          status: row.status || "active",
          sortOrder: Number(row.sortOrder ?? 0),
          description: row.description || "Imported from the VEGETA seed workbook.",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    categories.set(String(row._id), category._id);
  }
  const allergens = new Map();
  for (const row of catalog.allergens) {
    const allergen = await models.allergens.findOneAndUpdate(
      { slug: row.slug },
      {
        $set: {
          name: row.name,
          slug: row.slug,
          status: row.status || "active",
          description: row.description || "Imported from the VEGETA seed workbook.",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    allergens.set(String(row._id), allergen._id);
  }
  const foods = new Map();
  for (const row of catalog.foods) {
    const food = await upsertOwned(
      models.foodItems,
      { slug: row.slug },
      {
        name: row.name,
        normalizedName: row.normalizedName,
        slug: row.slug,
        aliases: row.aliases,
        description: row.description,
        categoryId: categories.get(String(row.categoryId)),
        imageUrl: row.imageUrl,
        defaultServing: row.defaultServing,
        nutritionPer100g: row.nutritionPer100g,
        nutritionDataQuality: row.nutritionDataQuality,
        sourceAttribution: row.sourceAttribution,
        allergenIds: row.allergenIds.map((id) => allergens.get(String(id))).filter(Boolean),
        isVegan: row.isVegan,
        isVegetarian: row.isVegetarian,
        status: row.status,
        createdBy: author._id,
        updatedBy: author._id,
      },
    );
    foods.set(String(row.workbookId), food._id);
  }
  const mapIngredient = (item) => ({
    ...item,
    foodItemId: foods.get(String(item.foodItemId)),
    allergenIds: item.allergenIds.map((id) => allergens.get(String(id))).filter(Boolean),
  });
  const recipes = new Map();
  for (const row of catalog.recipes) {
    const recipe = await upsertOwned(
      models.recipes,
      { slug: row.slug },
      {
        title: row.title,
        slug: row.slug,
        authorId: author._id,
        summary: row.summary,
        description: row.description,
        coverImageUrl: row.coverImageUrl,
        categoryIds: row.categoryIds.map((id) => categories.get(String(id))).filter(Boolean),
        tags: row.tags,
        cuisine: row.cuisine,
        difficulty: row.difficulty,
        prepMinutes: row.prepMinutes,
        cookMinutes: row.cookMinutes,
        totalMinutes: row.totalMinutes,
        servings: row.servings,
        ingredients: row.ingredients.map(mapIngredient),
        variants: row.variants.map((variant) => ({
          ...variant,
          ingredients: variant.ingredients.map(mapIngredient),
          allergenIds: variant.allergenIds.map((id) => allergens.get(String(id))).filter(Boolean),
        })),
        steps: row.steps,
        nutritionPerServing: row.nutritionPerServing,
        nutritionCalculation: row.nutritionCalculation,
        nutritionDataQuality: row.nutritionDataQuality,
        sourceAttribution: row.sourceAttribution,
        allergenIds: row.allergenIds.map((id) => allergens.get(String(id))).filter(Boolean),
        isVegan: row.isVegan,
        isVegetarian: row.isVegetarian,
        sourceType: "admin",
        status: "published",
        visibility: "public",
        publishedAt: new Date(row.publishedAt),
        deletedAt: null,
      },
    );
    recipes.set(String(row.workbookId), recipe._id);
  }
  for (const row of catalog.posts) {
    const tags = split(row.tags);
    const marker = row.marker || tags.find((tag) => tag.startsWith("community-load-v1-"));
    if (!marker) throw new Error(`Workbook post ${row._id} has no stable marker`);
    await models.posts.updateOne(
      { tags: marker },
      {
        $set: {
          authorId: author._id,
          title: row.title,
          content: row.content,
          tags,
          categoryIds: split(row.categoryIds)
            .map((id) => categories.get(String(id)))
            .filter(Boolean),
          recipeId: row.recipeId ? recipes.get(String(row.recipeId)) : null,
          foodItemIds: split(row.foodItemIds)
            .map((id) => foods.get(String(id)))
            .filter(Boolean),
          postType: row.postType || "community",
          visibility: row.visibility || "public",
          status: row.status || "published",
          publishedAt: new Date(row.publishedAt),
          deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
          rejectionReason: row.rejectionReason || null,
        },
        $setOnInsert: {
          version: 0,
          viewCount: 0,
          saveCount: 0,
          commentCount: 0,
          reactionCount: 0,
        },
      },
      { upsert: true, runValidators: true },
    );
  }
  const counters = {
    categories: categories.size,
    allergens: allergens.size,
    foods: foods.size,
    recipes: recipes.size,
    variants: catalog.stats.variants,
    posts: catalog.posts.length,
  };
  logger.info({ counters }, "Workbook catalog import finished; no records deleted");
  return counters;
}

const argument = (values, name) => {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
};

export async function main(args = process.argv.slice(2)) {
  const catalogPath = path.resolve(argument(args, "--catalog") ?? DEFAULT_CATALOG);
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  if (!args.includes("--apply")) {
    console.log(
      `Dry run: ${JSON.stringify(catalog.stats)}. Add --apply to upsert; nothing is deleted.`,
    );
    return catalog.stats;
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
    return await importWorkbookCatalog(container, catalog);
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
