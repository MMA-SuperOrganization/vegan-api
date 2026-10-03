import { describe, expect, it } from "vitest";
import request from "supertest";
import { createContractRegistry } from "../../src/contracts/registry.js";
import { buildTestApp, bearer, TEST_TOKENS, TEST_IDS } from "../helpers/test-app.js";
import { assertResponse } from "./assert-response.js";

const registry = createContractRegistry();
const check = (operationId, response) => {
  const operation = registry.operations.find((route) => route.operationId === operationId);
  expect(response.status, operationId).toBe(operation.status);
  assertResponse(
    response.body,
    registry.schemas[operation.response],
    registry.schemas,
    operationId,
  );
};

describe("Concrete response contracts against mounted HTTP results", () => {
  it("matches real health, bootstrap, home, auth, profile and list envelopes", async () => {
    const { app } = buildTestApp({
      overrides: {
        getDatabaseStatus: () => "connected",
        repositories: {
          aiFeedback: {
            async aggregate() {
              return [{ data: [], total: [], summary: [] }];
            },
          },
        },
      },
    });
    for (const operationId of [
      "checkLiveness",
      "checkReadiness",
      "getAppConfig",
      "bootstrapApp",
      "getHomeFeed",
      "getMe",
      "getMyProfileSummary",
      "getMyFullProfile",
      "getMyNutritionProfile",
      "getOnboardingStatus",
      "getAdminUsers",
      "getMyActivity",
      "getPantry",
      "getCategories",
      "getAllergens",
      "searchFoodItems",
      "getRecipes",
      "searchContent",
      "getRecentSearches",
      "discoverContent",
      "getMealPlans",
      "getCurrentMealPlan",
      "getGroceryLists",
      "getDiaryEntries",
      "getDiarySummary",
      "getWeightLogs",
      "getWeightTrend",
      "getWaterLogs",
      "getMyMedia",
      "getPosts",
      "getComments",
      "getSavedItems",
      "getNotifications",
      "getUnreadNotificationCount",
      "getNotificationPreferences",
      "getReminders",
      "getMyReports",
      "getModerationCases",
      "getVideos",
      "getViewHistory",
      "getAiRuns",
      "getAiFeedback",
      "getPendingContent",
    ]) {
      // Comments require a real published polymorphic target; covered by flow below.
      if (operationId === "getComments") continue;
      const operation = registry.operations.find((route) => route.operationId === operationId);
      let call = request(app)[operation.method.toLowerCase()](`/api/v1${operation.path}`);
      if (!["public", "optional"].includes(operation.auth))
        call = call.set(bearer(operation.auth === "admin" ? TEST_TOKENS.admin : TEST_TOKENS.user));
      check(operationId, await call);
    }
    check(
      "bootstrapApp",
      await request(app).get("/api/v1/app/bootstrap").set(bearer(TEST_TOKENS.user)),
    );
    check("getHomeFeed", await request(app).get("/api/v1/home").set(bearer(TEST_TOKENS.user)));
  });

  it("matches model-backed identity/master data and operation-specific deletion results", async () => {
    const { app } = buildTestApp();
    const admin = bearer(TEST_TOKENS.admin),
      user = bearer(TEST_TOKENS.user);
    check("syncAuth", await request(app).post("/api/v1/auth/sync").set(user).send({}));
    check(
      "updateMyProfile",
      await request(app).patch("/api/v1/users/me").set(user).send({ displayName: "Contract User" }),
    );
    check(
      "upsertMyProfile",
      await request(app)
        .put("/api/v1/profiles/me")
        .set(user)
        .send({ bio: "Vegan", dietType: "vegan" }),
    );
    check(
      "upsertMyNutritionProfile",
      await request(app).put("/api/v1/nutrition-profiles/me").set(user).send({
        heightCm: 170,
        currentWeightKg: 65,
        goal: "maintain",
        activityLevel: "moderate",
        allergenIds: [],
      }),
    );
    const category = await request(app)
      .post("/api/v1/categories")
      .set(admin)
      .send({ name: "Legumes", type: "food" });
    check("createCategory", category);
    check(
      "deleteCategory",
      await request(app).delete(`/api/v1/categories/${category.body.data._id}`).set(admin),
    );
    const reminder = await request(app)
      .post("/api/v1/reminders")
      .set(user)
      .send({
        type: "water",
        title: "Drink",
        body: "Drink a glass of water",
        schedule: { mode: "daily", at: "20:00", timezone: "UTC" },
      });
    check("createReminder", reminder);
    check(
      "deleteReminder",
      await request(app).delete(`/api/v1/reminders/${reminder.body.data._id}`).set(user),
    );
    const weight = await request(app).post("/api/v1/weight-logs").set(user).send({ weightKg: 65 });
    check("createWeightLog", weight);
    check(
      "deleteWeightLog",
      await request(app).delete(`/api/v1/weight-logs/${weight.body.data._id}`).set(user),
    );
  });

  it("matches nonempty content, planning, pantry and moderation composites", async () => {
    const { app } = buildTestApp();
    const admin = bearer(TEST_TOKENS.admin),
      user = bearer(TEST_TOKENS.user);
    const category = await request(app)
      .post("/api/v1/categories")
      .set(admin)
      .send({ name: "Foods", type: "food" });
    const food = await request(app)
      .post("/api/v1/food-items")
      .set(admin)
      .send({
        name: "Tofu",
        categoryId: category.body.data._id,
        defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
        nutritionPer100g: { caloriesKcal: 100 },
        isVegan: true,
        isVegetarian: true,
      });
    check("createFoodItem", food);
    const recipe = await request(app)
      .post("/api/v1/recipes")
      .set(user)
      .send({
        title: "Tofu bowl",
        servings: 1,
        ingredients: [{ foodItemId: food.body.data._id, quantity: 100, unit: "g" }],
        steps: [{ order: 1, instruction: "Cook tofu" }],
      });
    check("createRecipe", recipe);
    const recipeId = recipe.body.data._id;
    check("submitRecipe", await request(app).post(`/api/v1/recipes/${recipeId}/submit`).set(user));
    check(
      "publishRecipe",
      await request(app).post(`/api/v1/recipes/${recipeId}/publish`).set(admin),
    );
    check("getRecipe", await request(app).get(`/api/v1/recipes/${recipeId}`).set(user));
    check("getRecipes", await request(app).get("/api/v1/recipes"));
    check("searchContent", await request(app).get("/api/v1/search?q=Tofu"));
    check("getHomeFeed", await request(app).get("/api/v1/home"));
    check("discoverContent", await request(app).get("/api/v1/discover"));
    const comment = await request(app)
      .post("/api/v1/comments")
      .set(user)
      .send({ targetType: "recipe", targetId: recipeId, content: "Great" });
    check("createComment", comment);
    check(
      "getComments",
      await request(app).get(`/api/v1/comments?targetType=recipe&targetId=${recipeId}`),
    );
    check(
      "deleteComment",
      await request(app).delete(`/api/v1/comments/${comment.body.data._id}`).set(user),
    );
    check(
      "addPantryItem",
      await request(app)
        .post("/api/v1/pantry/items")
        .set(user)
        .send({ foodItemId: food.body.data._id, quantity: 500, unit: "g" }),
    );
    const plan = await request(app)
      .post("/api/v1/meal-plans")
      .set(user)
      .send({
        title: "Week",
        weekStartDate: "2026-10-05",
        days: [{ date: "2026-10-05", meals: [{ type: "lunch", recipeId, servings: 1 }] }],
      });
    check("createMealPlan", plan);
    check(
      "generateGroceryListFromPlan",
      await request(app)
        .post(`/api/v1/meal-plans/${plan.body.data._id}/grocery-list`)
        .set(user)
        .send({}),
    );
    check(
      "hideContent",
      await request(app)
        .post(`/api/v1/admin/moderation/recipe/${recipeId}/hide`)
        .set(admin)
        .send({ reason: "Review" }),
    );
    check(
      "restoreContent",
      await request(app)
        .post(`/api/v1/admin/moderation/recipe/${recipeId}/restore`)
        .set(admin)
        .send({ reason: "Reviewed" }),
    );
  });

  it("matches AI chat, structured proposals and confirmed resources with null external calls", async () => {
    const recipeId = "200000000000000000000001";
    const { app } = buildTestApp({
      envOverrides: {
        AI_ENABLED: "true",
        AI_BASE_URL: "https://fake.test/v1",
        AI_API_KEY: "test-key",
        AI_CHAT_MODEL: "fake",
        AI_VISION_MODEL: "fake",
      },
      seed: {
        foodItems: [
          {
            _id: "200000000000000000000002",
            name: "Tofu",
            status: "active",
            isVegan: true,
            isVegetarian: true,
            defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
            nutritionPer100g: { caloriesKcal: 100 },
          },
        ],
        recipes: [
          {
            _id: recipeId,
            title: "Bowl",
            slug: "bowl",
            authorId: TEST_IDS.user,
            status: "published",
            visibility: "public",
            deletedAt: null,
            servings: 1,
            ingredients: [
              {
                foodItemId: "200000000000000000000002",
                foodNameSnapshot: "Tofu",
                quantity: 200,
                unit: "g",
                gramEquivalent: 200,
              },
            ],
            steps: [],
            nutritionPerServing: { caloriesKcal: 200 },
          },
        ],
      },
      overrides: {
        aiProvider: {
          enabled: true,
          provider: "fake",
          async generate({ feature }) {
            return {
              model: "fake",
              data:
                feature === "chat"
                  ? { content: "Try tofu" }
                  : {
                      title: "Day",
                      days: [
                        { date: "2026-10-05", meals: [{ slot: "lunch", recipeId, servings: 1 }] },
                      ],
                    },
            };
          },
        },
      },
    });
    const user = bearer(TEST_TOKENS.user);
    const conversation = await request(app)
      .post("/api/v1/ai/conversations")
      .set(user)
      .send({ title: "Cooking" });
    check("createAiConversation", conversation);
    check(
      "sendAiMessage",
      await request(app)
        .post(`/api/v1/ai/conversations/${conversation.body.data._id}/messages`)
        .set(user)
        .send({ content: "What should I cook?" }),
    );
    const proposal = await request(app)
      .post("/api/v1/ai/meal-plan-proposals")
      .set(user)
      .send({ startDate: "2026-10-05", days: 1 });
    check("createMealPlanProposal", proposal);
    check(
      "confirmMealPlanProposal",
      await request(app)
        .post(`/api/v1/ai/meal-plan-proposals/${proposal.body.data.proposalId}/confirm`)
        .set(user)
        .send({ activate: false }),
    );
  });

  it("matches validation/auth failures with the actual centralized error envelope", async () => {
    const { app } = buildTestApp();
    for (const response of [
      await request(app).get("/api/v1/users/me"),
      await request(app).get("/api/v1/recipes?limit=invalid"),
      await request(app).get("/api/v1/admin/users").set(bearer(TEST_TOKENS.user)),
    ]) {
      expect([400, 401, 403]).toContain(response.status);
      assertResponse(response.body, registry.schemas.ErrorEnvelope, registry.schemas);
    }
  });
});
