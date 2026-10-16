import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { buildTestApp, TEST_IDS, TEST_TOKENS, bearer } from "../helpers/test-app.js";
const id = (number) => number.toString(16).padStart(24, "0");
const category = {
  _id: id(401),
  name: "Vegetables",
  slug: "vegetables",
  type: "food",
  status: "active",
};
const food = {
  _id: id(402),
  name: "Carrot",
  normalizedName: "carrot",
  slug: "carrot",
  categoryId: category._id,
  status: "active",
  isVegan: true,
  isVegetarian: true,
  allergenIds: [],
  defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
  nutritionPer100g: { caloriesKcal: 40, proteinG: 1, carbsG: 9, fatG: 0, fiberG: 3 },
};
const recipe = {
  _id: id(403),
  title: "Carrot bowl",
  slug: "carrot-bowl",
  authorId: TEST_IDS.admin,
  status: "published",
  visibility: "public",
  deletedAt: null,
  isVegan: true,
  isVegetarian: true,
  allergenIds: [],
  servings: 1,
  nutritionPerServing: food.nutritionPer100g,
  ingredients: [
    {
      foodItemId: food._id,
      foodNameSnapshot: food.name,
      quantity: 100,
      unit: "g",
      gramEquivalent: 100,
    },
  ],
  steps: [{ order: 1, instruction: "Steam carrot" }],
};
const fixture = (seed = {}) =>
  buildTestApp({ seed: { categories: [category], foodItems: [food], recipes: [recipe], ...seed } });
const auth = (kind = "user") => bearer(TEST_TOKENS[kind]);
describe("product expansion contracts", () => {
  it("round-trips private profile fields, rejects duplicate usernames and protects privacy", async () => {
    const { app } = fixture();
    const body = {
      username: "vegan_thang",
      city: "Ho Chi Minh City",
      country: "Vietnam",
      preferredFoodItemIds: [food._id],
      excludedFoodItemIds: [],
    };
    const saved = await request(app).put("/api/v1/profiles/me").set(auth()).send(body);
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.data).toMatchObject(body);
    const duplicate = await request(app)
      .put("/api/v1/profiles/me")
      .set(auth("other"))
      .send({ username: "VEGAN_THANG" });
    expect(duplicate.status).toBe(409);
    const publicProfile = await request(app).get(`/api/v1/users/${TEST_IDS.user}/public`);
    expect(publicProfile.body.data.username).toBe("vegan_thang");
    for (const field of [
      "city",
      "country",
      "preferredFoodItemIds",
      "excludedFoodItemIds",
      "dateOfBirth",
      "email",
    ])
      expect(publicProfile.body.data).not.toHaveProperty(field);
  });
  it("validates food references and username format", async () => {
    const { app } = fixture();
    expect(
      (await request(app).put("/api/v1/profiles/me").set(auth()).send({ username: "bad name" }))
        .status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put("/api/v1/profiles/me")
          .set(auth())
          .send({ excludedFoodItemIds: [id(9999)] })
      ).status,
    ).toBe(404);
  });
  it("allows same-type category trees and rejects self/ancestor cycles and cross-type parents", async () => {
    const { app } = fixture();
    const created = await request(app)
      .post("/api/v1/categories")
      .set(auth("admin"))
      .send({ name: "Root vegetables", type: "food", parentId: category._id });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const child = created.body.data._id;
    expect(
      (
        await request(app)
          .patch(`/api/v1/categories/${category._id}`)
          .set(auth("admin"))
          .send({ parentId: child })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/v1/categories/${child}`)
          .set(auth("admin"))
          .send({ parentId: child })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/v1/categories")
          .set(auth("admin"))
          .send({ name: "Dinner", type: "recipe", parentId: category._id })
      ).status,
    ).toBe(400);
  });
  it.each(["categories", "allergens", "food-items"])(
    "keeps inactive %s invisible to guests/users and permits authenticated admin recovery",
    async (collection) => {
      const inactive =
        collection === "food-items"
          ? { ...food, status: "inactive" }
          : collection === "categories"
            ? { ...category, status: "inactive" }
            : { _id: id(404), name: "Soy", slug: "soy", status: "inactive" };
      const key = collection === "food-items" ? "foodItems" : collection;
      const { app } = fixture({ [key]: [inactive] });
      expect(
        (await request(app).get(`/api/v1/${collection}`).query({ status: "inactive" })).body.data,
      ).toEqual([]);
      expect(
        (await request(app).get(`/api/v1/${collection}`).set(auth()).query({ status: "inactive" }))
          .body.data,
      ).toEqual([]);
      const admin = await request(app)
        .get(`/api/v1/${collection}`)
        .set(auth("admin"))
        .query({ status: "inactive" });
      expect(admin.status).toBe(200);
      expect(admin.body.data).toHaveLength(1);
      expect(
        (await request(app).get(`/api/v1/${collection}`).set("Authorization", "Bearer invalid"))
          .status,
      ).toBe(401);
      const restored = await request(app)
        .patch(`/api/v1/${collection}/${inactive._id}`)
        .set(auth("admin"))
        .send({ status: "active" });
      expect(restored.status, JSON.stringify(restored.body)).toBe(200);
    },
  );
  it("round-trips food descriptions/months and rejects invalid harvest months", async () => {
    const { app } = fixture();
    const response = await request(app)
      .patch(`/api/v1/food-items/${food._id}`)
      .set(auth("admin"))
      .send({ description: "A root vegetable", seasons: [1, 2, 2, 12] });
    expect(response.status).toBe(200);
    expect(response.body.data.seasons).toEqual([1, 2, 12]);
    const publicFood = await request(app).get(`/api/v1/food-items/${food._id}`);
    expect(publicFood.body.data.description).toBe("A root vegetable");
    expect(
      (
        await request(app)
          .patch(`/api/v1/food-items/${food._id}`)
          .set(auth("admin"))
          .send({ seasons: [13] })
      ).status,
    ).toBe(400);
  });
  it("completes a plan, releases its active slot, prevents editing it, and clones to a new draft", async () => {
    const { app, repositories } = fixture();
    const create = () =>
      request(app)
        .post("/api/v1/meal-plans")
        .set(auth())
        .send({
          weekStartDate: "2026-10-12",
          days: [
            { date: "2026-10-12", meals: [{ type: "lunch", recipeId: recipe._id, servings: 1 }] },
          ],
        });
    const created = await create();
    expect(created.status).toBe(201);
    const planId = created.body.data._id;
    expect(
      (await request(app).post(`/api/v1/meal-plans/${planId}/activate`).set(auth()).send({}))
        .status,
    ).toBe(200);
    const completed = await request(app)
      .patch(`/api/v1/meal-plans/${planId}`)
      .set(auth())
      .send({ status: "completed" });
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe("completed");
    expect(
      (await repositories.mealPlanActiveSlots.findOne({ userId: TEST_IDS.user })).activePlanId,
    ).toBeNull();
    expect(
      (
        await request(app)
          .post(`/api/v1/meal-plans/${planId}/meals`)
          .set(auth())
          .send({ date: "2026-10-12", type: "dinner", recipeId: recipe._id, servings: 1 })
      ).status,
    ).toBe(409);
    expect(
      (await request(app).post(`/api/v1/meal-plans/${planId}/activate`).set(auth()).send({}))
        .status,
    ).toBe(409);
    const cloned = await request(app)
      .post(`/api/v1/meal-plans/${planId}/clone`)
      .set(auth())
      .send({ weekStartDate: "2026-10-19" });
    expect(cloned.status).toBe(200);
    expect(cloned.body.data.status).toBe("draft");
  });
  it("applies food exclusions to pantry suggestions", async () => {
    const { app } = fixture({
      userProfiles: [{ userId: TEST_IDS.user, dietType: "vegan", excludedFoodItemIds: [food._id] }],
      nutritionProfiles: [{ userId: TEST_IDS.user, allergenIds: [] }],
    });
    const result = await request(app).get("/api/v1/pantry/recipe-suggestions").set(auth());
    expect(result.status, JSON.stringify(result.body)).toBe(200);
    expect(result.body.data).toEqual([]);
  });
  it("sends nutrition context to the AI provider only with explicit consent", async () => {
    const aiProvider = {
      enabled: true,
      generate: vi.fn(async () => ({ data: { content: "Try a vegetable bowl." } })),
    };
    const { app } = buildTestApp({
      envOverrides: {
        AI_ENABLED: "true",
        AI_BASE_URL: "https://ai.example.test/v1",
        AI_API_KEY: "offline-key",
        AI_CHAT_MODEL: "chat",
        AI_VISION_MODEL: "vision",
      },
      overrides: { aiProvider },
      seed: {
        userProfiles: [{ userId: TEST_IDS.user, dietType: "vegan" }],
        nutritionProfiles: [{ userId: TEST_IDS.user, dailyCalorieTarget: 2345, allergenIds: [] }],
      },
    });
    const conversation = await request(app)
      .post("/api/v1/ai/conversations")
      .set(auth())
      .send({ title: "Test" });
    const path = `/api/v1/ai/conversations/${conversation.body.data._id}/messages`;
    expect(
      (await request(app).post(path).set(auth()).send({ content: "Suggest a lunch" })).status,
    ).toBe(200);
    expect(JSON.stringify(aiProvider.generate.mock.calls[0][0])).not.toContain("2345");
    expect(
      (
        await request(app)
          .post(path)
          .set(auth())
          .send({ content: "Suggest a dinner", useProfile: true })
      ).status,
    ).toBe(200);
    expect(JSON.stringify(aiProvider.generate.mock.calls[1][0])).toContain("2345");
  });
});
