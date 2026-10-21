// Explicit integration runner: real MongoDB, isolated generated database, fake Firebase only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import pino from "pino";
import { loadEnv } from "../src/config/env.js";
import { createContainer } from "../src/container.js";
import { createApp } from "../src/app.js";
import { createFakeAuthProvider } from "../tests/helpers/fakes.js";

if (!process.argv.includes("--allow-isolated-write")) {
  console.error(
    "Pass --allow-isolated-write to create test records in a new test_vegan_sprint2_<uuid> database.",
  );
  process.exit(1);
}
const local = loadEnv();
const database = `test_vegan_sprint2_${randomUUID().replaceAll("-", "")}`;
assert.notEqual(database, local.database.dbName);
const logger = pino({ level: "silent" });
const env = loadEnv({ NODE_ENV: "test", SWAGGER_ENABLED: "false", LOG_LEVEL: "silent" });
const authProvider = createFakeAuthProvider({
  "sprint2-token": {
    firebaseUid: `sprint2-${database}`,
    email: "sprint2@example.test",
    displayName: "Sprint 2",
  },
});
const makeContainer = () =>
  createContainer({
    env,
    logger,
    overrides: {
      authProvider,
      storageProvider: null,
      messagingProvider: null,
      aiProvider: { enabled: false },
    },
  });
let container;
let app;
let requests = 0;
let verifiedEmpty = false;
const owned = new Map();
function track(model, document) {
  const name = model.collection.name;
  if (!owned.has(name)) owned.set(name, new Map());
  owned.get(name).set(String(document._id), document._id);
  return document;
}
async function call(method, path, body, status = 200, authenticated = true) {
  let pending = request(app)[method](`/api/v1${path}`);
  if (authenticated) pending = pending.set("Authorization", "Bearer sprint2-token");
  if (body !== undefined) pending = pending.send(body);
  const response = await pending;
  requests++;
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(response.body)}`);
  return response.body.data;
}
try {
  console.log("Connecting to generated isolated Sprint 2 database");
  await mongoose.connect(local.database.uri, {
    dbName: database,
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10000,
  });
  assert.equal(mongoose.connection.name, database);
  const existing = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  assert.equal(existing.length, 0, "Refusing to use a nonempty test database");
  verifiedEmpty = true;
  container = makeContainer();
  const coreModels = [
    "users",
    "userProfiles",
    "nutritionProfiles",
    "categories",
    "foodItems",
    "recipes",
    "MealPlansModel",
    "GroceryListsModel",
    "DiaryModel",
    "WeightLogsModel",
  ];
  for (const key of coreModels) {
    const model = container.models[key];
    assert.ok(model, `Missing model ${key}`);
    await model.createCollection();
    await model.createIndexes();
  }
  console.log("Checking authenticated profile and onboarding writes");
  app = createApp(container);
  await call("get", "/meal-plans", undefined, 401, false);
  await call("post", "/auth/sync", {});
  const user = await container.models.users.findOne({ firebaseUid: `sprint2-${database}` }).lean();
  track(container.models.users, user);
  const userId = user._id;
  await call("patch", "/users/me", { displayName: "Updated Sprint 2" });
  assert.equal((await call("post", "/auth/sync", {})).displayName, "Updated Sprint 2");
  await call("put", "/profiles/me", {
    dateOfBirth: "1998-04-05",
    gender: "female",
    bio: "Persistence test",
    timezone: "Asia/Ho_Chi_Minh",
  });
  await call("put", "/nutrition-profiles/me", {
    heightCm: 170,
    currentWeightKg: 65,
    dailyCalorieTarget: 2000,
    proteinTargetG: 100,
    carbTargetG: 250,
    fatTargetG: 60,
  });
  await call("put", "/nutrition-profiles/me", { proteinTargetG: -1 }, 400);
  await call("put", "/onboarding", {
    dietType: "vegan",
    goal: "maintain",
    activityLevel: "moderate",
    allergenIds: [],
  });
  await call("post", "/onboarding/complete", {});
  const profile = await call("get", "/users/me");
  assert.equal(profile.user.onboardingCompleted, true);
  assert.equal(profile.profile.gender, "female");
  assert.equal(profile.nutritionProfile.proteinTargetG, 100);
  const category = track(
    container.models.categories,
    (
      await container.models.categories.create({
        name: "Protein",
        slug: "sprint2-protein",
        type: "food",
        status: "active",
      })
    ).toObject(),
  );
  const food = track(
    container.models.foodItems,
    (
      await container.models.foodItems.create({
        name: "Tofu",
        normalizedName: "tofu",
        slug: "sprint2-tofu",
        categoryId: category._id,
        defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
        nutritionPer100g: { caloriesKcal: 100, proteinG: 10, carbsG: 5, fatG: 4 },
        isVegan: true,
        isVegetarian: true,
        status: "active",
      })
    ).toObject(),
  );
  const recipes = [];
  for (const [index, kcal] of [200, 300].entries()) {
    recipes.push(
      track(
        container.models.recipes,
        (
          await container.models.recipes.create({
            authorId: userId,
            title: `Sprint2 recipe ${index}`,
            slug: `sprint2-recipe-${index}`,
            status: "published",
            visibility: "public",
            publishedAt: new Date(),
            isVegan: true,
            servings: 2,
            ingredients: [
              {
                foodItemId: food._id,
                foodNameSnapshot: "Tofu",
                quantity: 400,
                unit: "g",
                gramEquivalent: 400,
              },
            ],
            nutritionPerServing: { caloriesKcal: kcal, proteinG: 20, carbsG: 25, fatG: 5 },
          })
        ).toObject(),
      ),
    );
  }
  const search = await call("get", "/recipes?q=Sprint2");
  console.log("Checking meal plan, grocery, diary and weight persistence");
  assert.ok(search.length >= 2 || search.data?.length >= 2);
  let plan = await call("post", "/meal-plans", { weekStartDate: "2026-10-19", days: [] }, 201);
  track(container.models.MealPlansModel, plan);
  plan = await call("post", `/meal-plans/${plan._id}/meals`, {
    date: "2026-10-20",
    type: "lunch",
    recipeId: String(recipes[0]._id),
    servings: 1,
  });
  const mealId = plan.days[0].meals[0].mealId;
  plan = await call("patch", `/meal-plans/${plan._id}/meals/${mealId}`, { servings: 2 });
  assert.equal(plan.nutritionSummary.caloriesKcal, 400);
  plan = await call("patch", `/meal-plans/${plan._id}/meals/${mealId}`, {
    recipeId: String(recipes[1]._id),
  });
  assert.equal(plan.nutritionSummary.caloriesKcal, 600);
  plan = await call("post", `/meal-plans/${plan._id}/meals`, {
    date: "2026-10-21",
    type: "dinner",
    recipeId: String(recipes[0]._id),
    servings: 1,
  });
  let list = await call("post", `/meal-plans/${plan._id}/grocery-list`, {
    from: "2026-10-20",
    to: "2026-10-21",
  });
  track(container.models.GroceryListsModel, list);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].quantity, 600);
  assert.equal(list.items[0].categorySnapshot, "Protein");
  list = await call("patch", `/grocery-lists/${list._id}/items/${list.items[0].itemId}`, {
    checked: true,
  });
  assert.equal(list.items[0].checked, true);
  const entry = await call(
    "post",
    "/diary",
    {
      date: "2026-10-20",
      mealType: "lunch",
      sourceType: "recipe",
      recipeId: String(recipes[1]._id),
      servings: 2,
      consumedAt: "2026-10-20T05:00:00Z",
    },
    201,
  );
  track(container.models.DiaryModel, entry);
  let summary = await call("get", "/diary/summary?date=2026-10-20");
  assert.equal(summary.nutrition.caloriesKcal, 600);
  assert.equal(summary.targetComparison.caloriesKcal.remaining, 1400);
  await call("patch", `/diary/${entry._id}`, { servings: 8 });
  summary = await call("get", "/diary/summary?date=2026-10-20");
  assert.equal(summary.targetComparison.caloriesKcal.remaining, -400);
  assert.equal((await call("get", "/diary/summary?date=2026-10-21")).entryCount, 0);
  const weight = await call(
    "post",
    "/weight-logs",
    { weightKg: 64.5, recordedAt: "2026-10-20T05:00:00Z" },
    201,
  );
  track(container.models.WeightLogsModel, weight);
  const history = await call(
    "get",
    "/weight-logs?from=2026-10-19&to=2026-10-21&timezone=Asia%2FHo_Chi_Minh",
  );
  assert.equal(history[0].weightKg, 64.5);
  // Recreate HTTP/service objects and read Mongo directly: no in-memory repository can satisfy these checks.
  container = makeContainer();
  app = createApp(container);
  assert.equal(
    (await call("get", `/meal-plans/${plan._id}`)).days[0].meals[0].recipeId,
    String(recipes[1]._id),
  );
  assert.equal((await call("get", `/grocery-lists/${list._id}`)).items[0].checked, true);
  assert.equal(
    (
      await mongoose.connection.db
        .collection("diaries")
        .findOne({ _id: new mongoose.Types.ObjectId(entry._id) })
    ).servings,
    8,
  );
  await call("patch", `/grocery-lists/${list._id}/items/${list.items[0].itemId}`, {
    checked: false,
  });
  assert.equal((await call("get", `/grocery-lists/${list._id}`)).items[0].checked, false);
  await call("delete", `/meal-plans/${plan._id}/meals/${mealId}`);
  assert.equal((await call("get", `/meal-plans/${plan._id}`)).days[0].meals.length, 0);
  await call("delete", `/diary/${entry._id}`);
  assert.equal((await call("get", "/diary/summary?date=2026-10-20")).entryCount, 0);
  console.log(
    JSON.stringify({
      passed: true,
      requests,
      persistence: "real MongoDB",
      identity: "fake Firebase",
      database,
    }),
  );
} finally {
  if (
    verifiedEmpty &&
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === database
  ) {
    // Account-derived documents created by HTTP are identified by this run's exact user ID.
    const users = [...(owned.get("users")?.values() ?? [])];
    for (const model of new Set(Object.values(container?.models ?? {}))) {
      if (model.schema.path("userId") && users.length)
        await model.collection.deleteMany({ userId: { $in: users } });
    }
    for (const [name, ids] of [...owned].reverse()) {
      await mongoose.connection.db.collection(name).deleteMany({
        _id: { $in: [...ids.values()].map((id) => new mongoose.Types.ObjectId(String(id))) },
      });
    }
    const collections = await mongoose.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray();
    for (const collection of collections) {
      assert.equal(
        await mongoose.connection.db.collection(collection.name).countDocuments({}),
        0,
        `Test cleanup left documents in ${collection.name}`,
      );
    }
    console.log("Isolated test records cleaned up; application database was not written");
  }
  await mongoose.disconnect();
}
