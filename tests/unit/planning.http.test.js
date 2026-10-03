import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, TEST_IDS, TEST_TOKENS } from "../helpers/test-app.js";
import { apiManifest } from "../../src/routes/api-manifest.js";
const FOOD = "200000000000000000000001";
const RECIPE = "300000000000000000000001";
const owned = ["pantries", "meal-plans", "grocery-lists", "diary", "weight-logs", "water-logs"];
function fixture() {
  const context = buildTestApp({
    seed: {
      foodItems: [
        {
          _id: FOOD,
          name: "Tofu",
          slug: "tofu",
          status: "active",
          nutritionPer100g: { caloriesKcal: 100, proteinG: 10 },
          defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
        },
      ],
      recipes: [
        {
          _id: RECIPE,
          title: "Tofu plate",
          slug: "tofu-plate",
          authorId: TEST_IDS.user,
          status: "published",
          visibility: "public",
          deletedAt: null,
          servings: 2,
          ingredients: [
            {
              foodItemId: FOOD,
              foodNameSnapshot: "Tofu",
              quantity: 400,
              unit: "g",
              gramEquivalent: 400,
            },
          ],
          nutritionPerServing: { caloriesKcal: 200, proteinG: 20 },
        },
      ],
    },
  });
  const exercised = new Set();
  const call = async (
    operationId,
    { params = {}, body, query = {}, token = TEST_TOKENS.user, expected } = {},
  ) => {
    const operation = apiManifest.find((operation) => operation.operationId === operationId);
    let path = operation.path.replace(/:([A-Za-z]+)/g, (_, key) => params[key]);
    let test = request(context.app)[operation.method.toLowerCase()](`/api/v1${path}`).query(query);
    if (token) test = test.set("Authorization", `Bearer ${token}`);
    if (body !== undefined) test = test.send(body);
    const response = await test;
    const expectedStatus =
      expected ??
      (/^(createMealPlan|createGroceryList|createDiaryEntry|createWeightLog|createWaterLog)$/.test(
        operationId,
      )
        ? 201
        : 200);
    expect(response.status, `${operationId}: ${JSON.stringify(response.body)}`).toBe(
      expectedStatus,
    );
    expect(response.body.meta).toHaveProperty("requestId");
    if (expectedStatus < 300) {
      exercised.add(operationId);
      expect(response.body.success).toBe(true);
    }
    return response.body;
  };
  return { ...context, call, exercised };
}

describe("planning HTTP routes through injected full application", () => {
  it("exercises every owned manifest operation with real validation and owner CRUD flows", async () => {
    const { call, exercised } = fixture();
    await call("getPantry");
    const pantry = await call("addPantryItem", {
      body: { foodItemId: FOOD, quantity: 100, unit: "g", expiresAt: "2026-10-04T12:00:00Z" },
    });
    const pantryItem = pantry.data.items[0].itemId;
    await call("addPantryItemsBulk", {
      body: { items: [{ foodItemId: FOOD, quantity: 1, unit: "kg" }], idempotencyKey: "http-bulk" },
    });
    await call("updatePantryItem", {
      params: { itemId: pantryItem },
      body: { note: "Updated", quantity: 50 },
    });
    await call("getExpiringPantryItems", { query: { days: 7 } });
    await call("getPantryRecipeSuggestions");
    await call("deletePantryItem", { params: { itemId: pantryItem } });

    const created = await call("createMealPlan", {
      body: {
        weekStartDate: "2026-10-05",
        title: "HTTP week",
        days: [{ date: "2026-10-05", meals: [{ type: "lunch", recipeId: RECIPE, servings: 2 }] }],
      },
    });
    const plan = created.data;
    const planParams = { id: plan._id };
    await call("getMealPlans", { query: { weekStartDate: "2026-10-05" } });
    await call("getMealPlan", { params: planParams });
    await call("updateMealPlan", { params: planParams, body: { title: "Changed week" } });
    const added = await call("addMealToPlan", {
      params: planParams,
      body: { date: "2026-10-06", type: "dinner", recipeId: RECIPE, servings: 1 },
    });
    const mealId = added.data.days[1].meals[0].mealId;
    const completion = await call("updateMealInPlan", {
      params: { ...planParams, mealId: plan.days[0].meals[0].mealId },
      body: { completed: true },
    });
    expect(completion.data.days[0].meals[0].servings).toBe(2);
    await call("deleteMealFromPlan", { params: { ...planParams, mealId } });
    await call("activateMealPlan", { params: planParams, body: {} });
    const current = await call("getCurrentMealPlan", { query: { date: "2026-10-06" } });
    expect(current.data._id).toBe(plan._id);
    const cloned = await call("cloneMealPlan", {
      params: planParams,
      body: { weekStartDate: "2026-10-12" },
    });
    expect(cloned.data.days[0].meals[0].completed).toBe(false);
    const generated = await call("generateGroceryListFromPlan", {
      params: planParams,
      body: { subtractPantry: false },
    });
    expect(generated.data.items[0].quantity).toBe(400);
    await call("deleteMealPlan", { params: { id: cloned.data._id } });

    const grocery = await call("createGroceryList", {
      body: { name: "Manual list", items: [{ nameSnapshot: "Bags", quantity: 1, unit: "piece" }] },
    });
    const groceryParams = { id: grocery.data._id };
    await call("getGroceryLists");
    await call("getGroceryList", { params: groceryParams });
    await call("updateGroceryList", { params: groceryParams, body: { name: "Shopping" } });
    const groceryAdded = await call("addGroceryItem", {
      params: groceryParams,
      body: { foodItemId: FOOD, quantity: 100, unit: "g" },
    });
    const itemId = groceryAdded.data.items[1].itemId;
    await call("updateGroceryItem", {
      params: { ...groceryParams, itemId },
      body: { checked: true },
    });
    await call("clearCheckedGroceryItems", { params: groceryParams, body: {} });
    await call("clearCheckedGroceryItems", { params: groceryParams, body: {} });
    await call("deleteGroceryItem", {
      params: { ...groceryParams, itemId: grocery.data.items[0].itemId },
    });
    await call("deleteGroceryList", { params: groceryParams });

    const diary = await call("createDiaryEntry", {
      body: {
        date: "2026-10-03",
        mealType: "lunch",
        sourceType: "recipe",
        recipeId: RECIPE,
        servings: 1,
      },
    });
    await call("getDiaryEntries", { query: { date: "2026-10-03" } });
    const diaryUpdated = await call("updateDiaryEntry", {
      params: { id: diary.data._id },
      body: { servings: 2 },
    });
    expect(diaryUpdated.data.nutritionSnapshot.caloriesKcal).toBe(400);
    const summary = await call("getDiarySummary", { query: { date: "2026-10-03" } });
    expect(summary.data.nutrition.caloriesKcal).toBe(400);
    await call("deleteDiaryEntry", { params: { id: diary.data._id } });

    const weight = await call("createWeightLog", {
      body: { weightKg: 75, recordedAt: "2026-10-03T12:00:00Z" },
    });
    await call("getWeightLogs", { query: { date: "2026-10-03" } });
    await call("updateWeightLog", { params: { id: weight.data._id }, body: { weightKg: 74 } });
    const trend = await call("getWeightTrend", { query: { date: "2026-10-03" } });
    expect(trend.data.count).toBe(1);
    expect(trend.data.endWeightKg).toBe(74);
    await call("deleteWeightLog", { params: { id: weight.data._id } });

    const water = await call("createWaterLog", {
      body: { amountMl: 250, recordedAt: "2026-10-03T12:00:00Z" },
    });
    await call("updateWaterLog", { params: { id: water.data._id }, body: { amountMl: 300 } });
    const waterList = await call("getWaterLogs", { query: { date: "2026-10-03" } });
    expect(waterList.meta.totalMl).toBe(300);
    await call("deleteWaterLog", { params: { id: water.data._id } });

    expect([...exercised].sort()).toEqual(
      apiManifest
        .filter((operation) => owned.includes(operation.module))
        .map((operation) => operation.operationId)
        .sort(),
    );
  });

  it("rejects unauthorized requests for every owned operation", async () => {
    const { app } = fixture();
    for (const operation of apiManifest.filter((operation) => owned.includes(operation.module))) {
      const path = operation.path
        .replace(/:itemId|:mealId/g, "bd0596da-66f9-497a-b935-d51a17ad288a")
        .replace(/:id/g, FOOD);
      const response = await request(app)
        [operation.method.toLowerCase()](`/api/v1${path}`)
        .send({});
      expect(response.status, operation.operationId).toBe(401);
    }
  });

  it("enforces strict authority/UUID/range validation and never exposes other owner documents", async () => {
    const { call } = fixture();
    await call("addPantryItem", {
      body: { foodItemId: FOOD, quantity: 1, unit: "g", userId: TEST_IDS.other },
      expected: 400,
    });
    await call("deletePantryItem", { params: { itemId: FOOD }, expected: 400 });
    await call("getWaterLogs", { query: { from: "2025-01-01", to: "2026-10-03" }, expected: 400 });
    const plan = await call("createMealPlan", { body: { weekStartDate: "2026-10-05" } });
    await call("getMealPlan", {
      params: { id: plan.data._id },
      token: TEST_TOKENS.other,
      expected: 404,
    });
    await call("updateMealPlan", {
      params: { id: plan.data._id },
      token: TEST_TOKENS.other,
      body: { title: "Hijacked" },
      expected: 404,
    });
    await call("updateMealInPlan", {
      params: { id: plan.data._id, mealId: "bd0596da-66f9-497a-b935-d51a17ad288a" },
      body: {},
      expected: 400,
    });
    const grocery = await call("createGroceryList", { body: { name: "Private" } });
    await call("getGroceryList", {
      params: { id: grocery.data._id },
      token: TEST_TOKENS.other,
      expected: 404,
    });
    const diary = await call("createDiaryEntry", {
      body: {
        date: "2026-10-03",
        mealType: "snack",
        sourceType: "custom",
        nameSnapshot: "Custom",
        nutritionSnapshot: { caloriesKcal: 100 },
      },
    });
    await call("deleteDiaryEntry", {
      params: { id: diary.data._id },
      token: TEST_TOKENS.other,
      expected: 404,
    });
    const weight = await call("createWeightLog", { body: { weightKg: 70 } });
    await call("updateWeightLog", {
      params: { id: weight.data._id },
      body: { weightKg: 80 },
      token: TEST_TOKENS.other,
      expected: 404,
    });
    const water = await call("createWaterLog", { body: { amountMl: 250 } });
    await call("deleteWaterLog", {
      params: { id: water.data._id },
      token: TEST_TOKENS.other,
      expected: 404,
    });
  });
});
