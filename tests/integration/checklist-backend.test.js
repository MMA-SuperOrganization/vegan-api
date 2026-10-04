import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { buildTestApp, TEST_IDS, TEST_TOKENS, bearer } from "../helpers/test-app.js";
import { assertResponse } from "../contract/assert-response.js";
import { createContractRegistry } from "../../src/contracts/registry.js";
const registry = createContractRegistry();
const assertOperationResponse = (operationId, response) => {
  const operation = registry.operations.find((route) => route.operationId === operationId);
  assertResponse(response.body, registry.schemas[operation.response], registry.schemas);
};

const id = (n) => n.toString(16).padStart(24, "0");
const recipe = (n, extra = {}) => ({
  _id: id(n),
  title: `Recipe ${n}`,
  slug: `recipe-${n}`,
  authorId: TEST_IDS.user,
  status: "published",
  visibility: "public",
  deletedAt: null,
  isVegan: true,
  isVegetarian: true,
  publishedAt: new Date("2026-10-01"),
  ...extra,
});
const userGet = (app, path, query) =>
  request(app)
    .get(`/api/v1/${path}`)
    .set(bearer(TEST_TOKENS.user))
    .query(query ?? {});

describe("backend acceptance gaps from the product checklist", () => {
  it.each(["pantry", "meal_plan"])(
    "confirms reviewed %s selections through real auth/validation/response contracts",
    async (type) => {
      const aiProvider = { enabled: true, generate: vi.fn() };
      const { app, repositories } = buildTestApp({
        envOverrides: {
          AI_ENABLED: "true",
          AI_BASE_URL: "https://ai.example.test/v1",
          AI_API_KEY: "offline-key",
          AI_CHAT_MODEL: "chat",
          AI_VISION_MODEL: "vision",
        },
        overrides: { aiProvider },
        seed: {
          foodItems: [{ _id: id(10), name: "Tofu", status: "active", isVegan: true }],
          recipes: [
            recipe(11, {
              servings: 1,
              nutritionPerServing: { caloriesKcal: 100 },
              ingredients: [{ foodItemId: id(10), quantity: 100, unit: "g" }],
            }),
          ],
          aiProposals: [
            {
              _id: id(20),
              userId: TEST_IDS.user,
              type,
              status: "pending",
              startDate: "2026-10-05",
              expiresAt: new Date("2026-10-04"),
              structuredData:
                type === "pantry"
                  ? { items: [{ name: "Unknown", quantity: 1, unit: "piece" }] }
                  : {
                      title: "Suggested meals",
                      days: [
                        {
                          date: "2026-10-05",
                          meals: [{ slot: "lunch", recipeId: id(11), servings: 1 }],
                        },
                      ],
                    },
            },
          ],
        },
      });
      const path = type === "pantry" ? "pantry-proposals" : "meal-plan-proposals";
      const operationId = type === "pantry" ? "confirmPantryProposal" : "confirmMealPlanProposal";
      const body =
        type === "pantry"
          ? { items: [{ foodItemId: id(10), quantity: 250, unit: "g" }] }
          : {
              title: "Reviewed meals",
              days: [
                { date: "2026-10-05", meals: [{ slot: "dinner", recipeId: id(11), servings: 2 }] },
              ],
            };
      const post = (token, payload) =>
        request(app)
          .post(`/api/v1/ai/${path}/${id(20)}/confirm`)
          .set(bearer(token))
          .send(payload);
      expect((await post(TEST_TOKENS.other, body)).status).toBe(404);
      expect((await post(TEST_TOKENS.user, { ...body, userId: TEST_IDS.other })).status).toBe(400);
      const first = await post(TEST_TOKENS.user, body);
      expect(first.status).toBe(200);
      assertOperationResponse(operationId, first);
      const replay = await post(TEST_TOKENS.user, {});
      expect(replay.status).toBe(200);
      expect(replay.body.data).toEqual(first.body.data);
      if (type === "pantry") {
        expect(first.body.data.resource.items[0]).toMatchObject({
          foodItemId: id(10),
          quantity: 250,
          unit: "g",
        });
      } else {
        expect(first.body.data.resource).toMatchObject({
          title: "Reviewed meals",
          status: "draft",
        });
        expect(first.body.data.resource.days[0].meals[0]).toMatchObject({
          type: "dinner",
          servings: 2,
        });
        expect(await repositories.mealPlans.count({ userId: TEST_IDS.user })).toBe(1);
      }
      expect(aiProvider.generate).not.toHaveBeenCalled();
    },
  );
  it("admin edits cannot keep a legacy video published without playable media", async () => {
    const { app, repositories } = buildTestApp({ seed: { videos: [recipe(7)] } });
    const res = await request(app)
      .patch(`/api/v1/videos/${id(7)}`)
      .set(bearer(TEST_TOKENS.admin))
      .send({ description: "Updated description" });
    expect(res.status).toBe(400);
    expect((await repositories.videos.findById(id(7))).description).toBeUndefined();
  });
  it("food composition updates validate the complete merged record", async () => {
    const { app, repositories } = buildTestApp({
      seed: { foodItems: [{ _id: id(8), status: "active", isVegan: true, isVegetarian: true }] },
    });
    const res = await request(app)
      .patch(`/api/v1/food-items/${id(8)}`)
      .set(bearer(TEST_TOKENS.admin))
      .send({ containsEggs: true });
    expect(res.status).toBe(400);
    expect((await repositories.foodItems.findById(id(8))).containsEggs).toBeUndefined();
  });
  it("pantry and recommendations check current food safety without rewriting snapshots", async () => {
    const { app, repositories } = buildTestApp({
      seed: {
        userProfiles: [{ userId: TEST_IDS.user, dietType: "lacto_vegetarian" }],
        nutritionProfiles: [{ userId: TEST_IDS.user, allergenIds: [id(99)] }],
        foodItems: [
          { _id: id(10), isVegetarian: true, containsEggs: true },
          { _id: id(11), isVegan: true, allergenIds: [id(99)] },
        ],
        recipes: [
          recipe(1),
          recipe(2, { isVegan: false, containsEggs: false, ingredients: [{ foodItemId: id(10) }] }),
          recipe(3, { ingredients: [{ foodItemId: id(11) }], allergenIds: [] }),
        ],
      },
    });
    const pantry = await userGet(app, "pantry/recipe-suggestions");
    const recommended = await userGet(app, "recommendations/recipes");
    expect(pantry.status).toBe(200);
    expect(recommended.status).toBe(200);
    expect(pantry.body.data.map((item) => item.recipe._id)).toEqual([id(1)]);
    expect(recommended.body.data.map((item) => item._id)).toEqual([id(1)]);
    expect((await repositories.recipes.findById(id(2))).containsEggs).toBe(false);
    expect((await repositories.recipes.findById(id(3))).allergenIds).toEqual([]);
  });
  it("diary uses the requested timezone for the default calendar date", async () => {
    const { app } = buildTestApp({ clock: () => new Date("2026-10-03T18:00:00Z") });
    const res = await userGet(app, "diary/summary", { timezone: "Asia/Ho_Chi_Minh" });
    expect(res.status).toBe(200);
    expect(res.body.data.to).toBe("2026-10-04");
  });
  it("public version policy and feature flags come from validated runtime configuration", async () => {
    const { app } = buildTestApp({
      envOverrides: {
        APP_MINIMUM_VERSION: "2.0.0",
        APP_LATEST_VERSION: "2.1.0",
        APP_FORCE_UPDATE: "true",
        VIDEOS_ENABLED: "false",
        COMMUNITY_ENABLED: "false",
      },
    });
    const res = await request(app).get("/api/v1/app/config");
    expect(res.status).toBe(200);
    expect(res.body.data.versionPolicy).toEqual({
      minimum: "2.0.0",
      latest: "2.1.0",
      forceUpdate: true,
    });
    expect(res.body.data.features).toEqual({ ai: false, videos: false, community: false });
    expect(JSON.stringify(res.body)).not.toMatch(/apiKey|privateKey/);
  });
  it("pantry suggestions respect the owner's diet and allergens", async () => {
    const { app } = buildTestApp({
      seed: {
        userProfiles: [{ userId: TEST_IDS.user, dietType: "vegan" }],
        nutritionProfiles: [{ userId: TEST_IDS.user, allergenIds: [id(99)] }],
        recipes: [recipe(1), recipe(2, { allergenIds: [id(99)] }), recipe(3, { isVegan: false })],
      },
    });
    const res = await userGet(app, "pantry/recipe-suggestions");
    expect(res.status).toBe(200);
    expect(res.body.data.map((item) => item.recipe._id)).toEqual([id(1)]);
  });
  it.each([
    ["meal", "meal-plans"],
    ["water", "water-logs"],
    ["custom", "reminders"],
  ])("%s reminders deliver a stable navigation route to the inbox", async (type, route) => {
    const { app, container } = buildTestApp({
      seed: {
        reminders: [
          {
            _id: id(30),
            userId: TEST_IDS.user,
            type,
            title: "Reminder",
            body: "Time to check",
            schedule: { mode: "once", at: "2026-10-03T12:00:00Z", timezone: "UTC" },
            status: "active",
            nextRunAt: new Date("2026-10-03T12:00:00Z"),
            lockExpiresAt: null,
            version: 0,
          },
        ],
      },
    });
    expect(await container.services.reminders.poll()).toEqual({ processed: 1, failed: 0 });
    const res = await userGet(app, "notifications");
    expect(res.status).toBe(200);
    expect(res.body.data[0].data).toMatchObject({ route, reminderId: id(30) });
    await container.services.reminders.poll();
    expect((await userGet(app, "notifications")).body.data).toHaveLength(1);
  });
  it("all advertised recommendation pages are accessible with small page sizes", async () => {
    const { app } = buildTestApp({
      seed: { recipes: Array.from({ length: 25 }, (_, i) => recipe(i + 1)) },
    });
    const first = await userGet(app, "recommendations/recipes", { limit: 1 });
    expect(first.status).toBe(200);
    expect(first.body.meta.totalPages).toBe(25);
    const last = await userGet(app, "recommendations/recipes", { limit: 1, page: 25 });
    expect(last.status).toBe(200);
    expect(last.body.data).toHaveLength(1);
    expect(last.body.data[0]._id).not.toBe(first.body.data[0]._id);
  });
  it("recommendations exclude the owner's selected allergens", async () => {
    const { app } = buildTestApp({
      seed: {
        userProfiles: [{ userId: TEST_IDS.user, dietType: "vegan", allergenIds: [id(99)] }],
        nutritionProfiles: [{ userId: TEST_IDS.user, allergenIds: [id(99)] }],
        recipes: [recipe(1), recipe(2, { allergenIds: [id(99)] })],
      },
    });
    const response = await userGet(app, "recommendations/recipes");
    expect(response.status).toBe(200);
    expect(response.body.data.map((r) => r._id)).toEqual([id(1)]);
  });
  it.each([
    ["lacto_vegetarian", [1, 2]],
    ["ovo_vegetarian", [1, 3]],
  ])("%s excludes prohibited and unknown ingredients consistently", async (dietType, expected) => {
    const rows = [
      recipe(1),
      recipe(2, { isVegan: false, containsEggs: false, containsDairy: true }),
      recipe(3, { isVegan: false, containsEggs: true, containsDairy: false }),
      recipe(4, { isVegan: false }),
    ];
    const { app } = buildTestApp({
      seed: { recipes: rows, userProfiles: [{ userId: TEST_IDS.user, dietType }] },
    });
    const responses = [
      await request(app).get("/api/v1/recipes").query({ dietType }),
      await request(app).get("/api/v1/search").query({ type: "recipe", dietType }),
      await userGet(app, "recommendations/recipes"),
    ];
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.data.map((r) => r._id).sort()).toEqual(expected.map(id));
    }
  });
  it("diary compares day and range against owned targets, including empty days and over-target intake", async () => {
    const { app } = buildTestApp({
      seed: {
        nutritionProfiles: [
          { userId: TEST_IDS.user, dailyCalorieTarget: 2000, proteinTargetG: 80 },
          { userId: TEST_IDS.other, dailyCalorieTarget: 500 },
        ],
        diaryEntries: [
          {
            _id: id(1),
            userId: TEST_IDS.user,
            date: new Date("2026-10-03"),
            nutritionSnapshot: { caloriesKcal: 2500, proteinG: 50 },
          },
          {
            _id: id(2),
            userId: TEST_IDS.other,
            date: new Date("2026-10-03"),
            nutritionSnapshot: { caloriesKcal: 9000 },
          },
        ],
      },
    });
    const day = await userGet(app, "diary/summary", { date: "2026-10-03" });
    expect(day.status).toBe(200);
    assertOperationResponse("getDiarySummary", day);
    expect(day.body.data.targetComparison.caloriesKcal).toEqual({
      consumed: 2500,
      target: 2000,
      remaining: -500,
      percentage: 125,
    });
    expect(day.body.data.days[0].targetComparison.proteinG.percentage).toBe(62.5);
    const range = await userGet(app, "diary/summary", { from: "2026-10-02", to: "2026-10-03" });
    expect(range.body.data.targetComparison.caloriesKcal.target).toBe(4000);
    expect(range.body.data.dailyTargets.fatG).toBeNull();
  });
  it("diary without targets returns explicit unavailable comparisons", async () => {
    const { app } = buildTestApp();
    const res = await userGet(app, "diary/summary", { date: "2026-10-03" });
    expect(res.status).toBe(200);
    assertOperationResponse("getDiarySummary", res);
    expect(res.body.data.targetComparison.caloriesKcal).toEqual({
      consumed: 0,
      target: null,
      remaining: null,
      percentage: null,
    });
  });
});
