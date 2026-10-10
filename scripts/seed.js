import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase as connectDB, disconnectDatabase } from "../src/config/database.js";
import { normalizeNutrition, calculateRecipeNutrition } from "../src/common/utils/nutrition.js";
import {
  EXTRA_FOOD_ROWS,
  EXTRA_RECIPE_ROWS,
  foodAliases,
  foodImageUrl,
  recipeImageUrl,
} from "./seed-data/discovery.fixtures.js";

export const DEMO_AUTHOR_UID = "internal:vegan-demo-fixtures:v1";
export const DEMO_AUTHOR_EMAIL = "vegan-demo-fixtures@example.invalid";
export const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const CATEGORY_FIXTURES = [
  ...["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"].map((name) => ({ name, type: "recipe" })),
  ...["Vegetables", "Fruits", "Grains", "Legumes", "Nuts & Seeds"].map((name) => ({
    name,
    type: "food",
  })),
  ...["Nutrition", "Lifestyle"].map((name) => ({ name, type: "post" })),
].map((item, sortOrder) => ({
  ...item,
  slug: slug(item.name),
  status: "active",
  sortOrder,
  description: "Demo fixture; replace with reviewed master data.",
}));
export const ALLERGEN_FIXTURES = ["Peanuts", "Tree Nuts", "Soy", "Wheat", "Sesame"].map((name) => ({
  name,
  slug: slug(name),
  status: "active",
  description: "Demo allergen fixture.",
}));
// Original demo macronutrients retained; unspecified micronutrients are zero, NOT verified absence.
const foodRows = [
  ["Broccoli", "Vegetables", 34, 2.8, 0.4, 6.6, 2.6],
  ["Spinach", "Vegetables", 23, 2.9, 0.4, 3.6, 2.2],
  ["Carrot", "Vegetables", 41, 0.9, 0.2, 9.6, 2.8],
  ["Kale", "Vegetables", 35, 2.9, 1.5, 4.4, 4.1],
  ["Apple", "Fruits", 52, 0.3, 0.2, 13.8, 2.4],
  ["Banana", "Fruits", 89, 1.1, 0.3, 22.8, 2.6],
  ["Orange", "Fruits", 47, 0.9, 0.1, 11.8, 2.4],
  ["Blueberries", "Fruits", 57, 0.7, 0.3, 14.5, 2.4],
  ["Oats", "Grains", 389, 16.9, 6.9, 66.3, 10.6],
  ["Quinoa", "Grains", 368, 14.1, 6.1, 64.2, 7],
  ["Brown Rice", "Grains", 370, 7.9, 2.9, 77.2, 3.5],
  ["Lentils", "Legumes", 353, 24.6, 1.1, 63.4, 10.7],
  ["Chickpeas", "Legumes", 364, 19.3, 6, 60.6, 17.4],
  ["Black Beans", "Legumes", 341, 21.6, 1.4, 62.4, 15.5],
  ["Tofu", "Legumes", 76, 8.1, 4.8, 1.9, 0.3, "Soy"],
  ["Almonds", "Nuts & Seeds", 579, 21.2, 49.9, 21.6, 12.5, "Tree Nuts"],
  ["Walnuts", "Nuts & Seeds", 654, 15.2, 65.2, 13.7, 6.7, "Tree Nuts"],
  ["Chia Seeds", "Nuts & Seeds", 486, 16.5, 30.7, 42.1, 34.4],
  ["Flaxseeds", "Nuts & Seeds", 534, 18.3, 42.2, 28.9, 27.3],
  ["Peanut Butter", "Nuts & Seeds", 588, 25.1, 50.4, 20, 6, "Peanuts"],
  ...EXTRA_FOOD_ROWS,
];
export const FOOD_FIXTURES = foodRows.map(
  ([name, category, caloriesKcal, proteinG, fatG, carbsG, fiberG, allergen]) => ({
    name,
    category,
    allergenNames: allergen ? [allergen] : [],
    normalizedName: name.toLowerCase(),
    slug: slug(name),
    aliases: foodAliases(name),
    imageUrl: foodImageUrl(category),
    status: "active",
    isVegan: true,
    isVegetarian: true,
    defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
    nutritionPer100g: normalizeNutrition({ caloriesKcal, proteinG, fatG, carbsG, fiberG }),
  }),
);
const recipeRows = [
  [
    "Oatmeal with Berries",
    "Breakfast",
    "easy",
    5,
    10,
    1,
    [
      ["Oats", 50],
      ["Blueberries", 30],
    ],
    ["Boil oats.", "Add berries."],
  ],
  [
    "Tofu Scramble",
    "Breakfast",
    "easy",
    10,
    10,
    2,
    [
      ["Tofu", 200],
      ["Spinach", 50],
    ],
    ["Crumble tofu.", "Cook with spinach."],
  ],
  [
    "Lentil Soup",
    "Lunch",
    "medium",
    15,
    40,
    4,
    [
      ["Lentils", 200],
      ["Carrot", 100],
    ],
    ["Chop carrot.", "Boil lentils and carrot."],
  ],
  [
    "Quinoa Salad",
    "Lunch",
    "easy",
    10,
    15,
    2,
    [
      ["Quinoa", 100],
      ["Broccoli", 50],
    ],
    ["Cook quinoa.", "Mix with broccoli."],
  ],
  [
    "Black Bean Tacos",
    "Dinner",
    "easy",
    10,
    10,
    3,
    [["Black Beans", 150]],
    [
      "Warm beans.",
      "Serve beans as a taco filling. Tortillas and toppings are not included in this demo nutrition.",
    ],
  ],
  [
    "Chickpea Curry",
    "Dinner",
    "medium",
    15,
    30,
    4,
    [["Chickpeas", 250]],
    ["Cook chickpeas. Optional curry spices are not included in this demo nutrition."],
  ],
  [
    "Apple Peanut Butter Snack",
    "Snack",
    "easy",
    5,
    0,
    1,
    [
      ["Apple", 100],
      ["Peanut Butter", 20],
    ],
    ["Slice apple.", "Dip in peanut butter."],
  ],
  [
    "Banana Smoothie",
    "Snack",
    "easy",
    5,
    0,
    1,
    [
      ["Banana", 100],
      ["Chia Seeds", 10],
    ],
    ["Blend banana and chia seeds with water."],
  ],
  ...EXTRA_RECIPE_ROWS,
];
export function buildRecipeFixtures({ categories, foods, authorId, sourceType = "admin" }) {
  if (!authorId) throw new Error("Demo recipes require an explicit author");
  return recipeRows.map(
    (
      [title, category, difficulty, prepMinutes, cookMinutes, servings, rows, instructions],
      index,
    ) => {
      const ingredients = rows.map(([name, quantity], order) => {
        const food = foods[name];
        if (!food?._id) throw new Error(`Missing canonical food fixture: ${name}`);
        return {
          foodItemId: food._id,
          foodNameSnapshot: food.name,
          quantity,
          unit: "g",
          gramEquivalent: quantity,
          nutritionPer100g: normalizeNutrition(food.nutritionPer100g),
          allergenIds: [...(food.allergenIds ?? [])],
          isVegan: food.isVegan,
          isVegetarian: food.isVegetarian,
          optional: false,
          order: order + 1,
        };
      });
      return {
        title,
        slug: slug(title),
        authorId,
        sourceType,
        status: "published",
        visibility: "public",
        categoryIds: [categories[category]],
        difficulty,
        prepMinutes,
        cookMinutes,
        totalMinutes: prepMinutes + cookMinutes,
        servings,
        summary:
          "Demo fixture. Approximate nutrition; not clinical or fully researched dietary advice.",
        coverImageUrl: recipeImageUrl(index),
        tags: ["demo-fixture"],
        ingredients,
        steps: instructions.map((step, stepIndex) => ({
          order: stepIndex + 1,
          ...(typeof step === "string" ? { instruction: step } : step),
        })),
        nutritionPerServing: calculateRecipeNutrition(ingredients, { servings }),
        allergenIds: [
          ...new Map(
            ingredients.flatMap((item) => item.allergenIds).map((id) => [String(id), id]),
          ).values(),
        ],
        isVegan: ingredients.every((item) => item.isVegan),
        isVegetarian: ingredients.every((item) => item.isVegetarian),
        publishedAt: new Date("2025-01-01T00:00:00.000Z"),
        deletedAt: null,
      };
    },
  );
}
export function parseSeedArgs(args = []) {
  const allowed = new Set(["--master-only", "--with-demo-content", "--help"]);
  for (const arg of args) if (!allowed.has(arg)) throw new Error(`Unknown seed option: ${arg}`);
  if (args.includes("--with-demo-content") && !args.includes("--master-only"))
    throw new Error("--with-demo-content requires --master-only");
  return {
    masterOnly: args.includes("--master-only"),
    withDemoContent: args.includes("--with-demo-content"),
    help: args.includes("--help"),
  };
}
export function validateAdminConfig(seed = {}) {
  const uid = seed.adminFirebaseUid?.trim();
  const email = seed.adminEmail?.trim().toLowerCase();
  if (
    !uid ||
    uid.length > 128 ||
    /change_me|placeholder|example|your[_ -]?uid/i.test(uid) ||
    uid.startsWith("internal:")
  )
    throw new Error(
      "Set a real SEED_ADMIN_FIREBASE_UID for an existing Firebase user, or use --master-only",
    );
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /change_me|placeholder|@example\.(com|org|net|invalid)$|\.invalid$/i.test(email)
  )
    throw new Error(
      "Set the real SEED_ADMIN_EMAIL matching that Firebase user, or use --master-only",
    );
  return { firebaseUid: uid, email };
}

const normalizeComparableValue = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toHexString === "function") return value.toHexString();
  if (Array.isArray(value)) return value.map(normalizeComparableValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, normalizeComparableValue(nestedValue)]),
    );
  return value;
};

export const hasSeedChanges = (existing, next) =>
  Object.keys(next).some(
    (key) =>
      !isDeepStrictEqual(
        normalizeComparableValue(existing?.[key]),
        normalizeComparableValue(next[key]),
      ),
  );

export async function runSeed(container, options = {}) {
  const { models, env, logger } = container;
  for (const key of ["users", "categories", "allergens", "foodItems", "recipes"])
    if (!models[key]) throw new Error(`Missing canonical container.models.${key}`);
  const counts = {};
  const upsert = async (key, filter, data, accepts = () => true) => {
    const model = models[key];
    const existing = await model.findOne(filter).lean();
    if (existing && !accepts(existing))
      throw new Error(
        `Seed conflict in ${model.collection.name}; existing record is not the expected fixture`,
      );
    const candidate = new model({ ...existing, ...data });
    await candidate.validate();
    const normalizedData = Object.fromEntries(
      Object.keys(data).map((field) => [field, candidate.toObject()[field]]),
    );
    counts[key] ??= { inserted: 0, updated: 0, unchanged: 0 };
    if (existing && !hasSeedChanges(existing, normalizedData)) {
      counts[key].unchanged++;
      return existing;
    }
    // No counters are supplied/reset. Existing application records with colliding slugs fail closed.
    const result = await model.updateOne(
      filter,
      { $set: normalizedData },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    counts[key][result.upsertedCount ? "inserted" : "updated"]++;
    return model.findOne(filter).lean();
  };
  let author;
  if (!options.masterOnly) {
    const admin = validateAdminConfig(env.seed);
    author = await upsert(
      "users",
      { firebaseUid: admin.firebaseUid },
      { ...admin, displayName: "System Admin", role: "admin", status: "active" },
      (existing) =>
        existing.status === "active" &&
        (!existing.email || existing.email.toLowerCase() === admin.email),
    );
  } else {
    logger.info("Master-only: explicitly skipping Firebase admin provisioning");
    if (options.withDemoContent)
      author = await upsert(
        "users",
        { firebaseUid: DEMO_AUTHOR_UID },
        {
          firebaseUid: DEMO_AUTHOR_UID,
          email: DEMO_AUTHOR_EMAIL,
          displayName: "Demo Fixture Author (internal only)",
          role: "user",
          status: "active",
        },
        (existing) =>
          existing.email === DEMO_AUTHOR_EMAIL &&
          existing.role === "user" &&
          existing.status === "active",
      );
  }
  const categories = {},
    allergens = {},
    foods = {};
  for (const item of CATEGORY_FIXTURES)
    categories[item.name] = (
      await upsert(
        "categories",
        { slug: item.slug },
        item,
        (existing) => existing.name === item.name && existing.type === item.type,
      )
    )._id;
  for (const item of ALLERGEN_FIXTURES)
    allergens[item.name] = (
      await upsert(
        "allergens",
        { slug: item.slug },
        item,
        (existing) => existing.name === item.name,
      )
    )._id;
  for (const { category, allergenNames, ...item } of FOOD_FIXTURES)
    foods[item.name] = await upsert(
      "foodItems",
      { slug: item.slug },
      {
        ...item,
        categoryId: categories[category],
        allergenIds: allergenNames.map((name) => allergens[name]),
      },
      (existing) => existing.name === item.name && existing.aliases?.includes("demo fixture"),
    );
  if (author)
    for (const item of buildRecipeFixtures({
      categories,
      foods,
      authorId: author._id,
      sourceType: options.masterOnly ? "community" : "admin",
    }))
      await upsert(
        "recipes",
        { slug: item.slug },
        item,
        (existing) =>
          String(existing.authorId) === String(author._id) &&
          existing.tags?.includes("demo-fixture"),
      );
  else
    logger.info(
      `Master-only: explicitly skipping all ${recipeRows.length} recipes; add --with-demo-content to create an internal demo author and recipes`,
    );
  logger.info({ counts }, "Seed finished; no data deleted");
  return counts;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseSeedArgs(args);
  if (options.help) {
    console.log(
      "seed [--master-only [--with-demo-content]]\nDefault requires a real existing Firebase admin UID/email. Master-only skips admin and recipes; demo content uses an internal non-login author.",
    );
    return;
  }
  const env = loadEnv();
  if (!env.database.uri) throw new Error("A configured MongoDB URI is required for seeding");
  if (!options.masterOnly) validateAdminConfig(env.seed);
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
    await connectDB({ ...env.database, logger });
    await runSeed(container, options);
  } finally {
    await disconnectDatabase();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
