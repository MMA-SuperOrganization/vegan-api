import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { buildTestApp, TEST_IDS, TEST_TOKENS } from "../helpers/test-app.js";
const uid = TEST_IDS.user,
  other = TEST_IDS.other;
const recipeId = "200000000000000000000001",
  foodId = "200000000000000000000002",
  imageId = "200000000000000000000003",
  videoId = "200000000000000000000004";
const envOverrides = {
  AI_ENABLED: "true",
  AI_BASE_URL: "https://fake.example.test/v1",
  AI_API_KEY: "test-key",
  AI_CHAT_MODEL: "test-chat",
  AI_VISION_MODEL: "test-vision",
};
const outputs = {
  chat: { content: "Cook tofu and beans." },
  meal_plan: {
    title: "Vegan day",
    days: [{ date: "2026-10-05", meals: [{ slot: "lunch", recipeId, servings: 1 }] }],
  },
  ingredient_recognition: {
    items: [{ foodItemId: foodId, name: "Tofu", quantity: 200, unit: "g" }],
  },
  video_summary: {
    summary: "A vegan bowl cooking lesson.",
    keyPoints: ["Add protein-rich beans."],
  },
};
function setup(options = {}) {
  const aiProvider = {
    enabled: true,
    provider: "fake",
    generate: vi.fn(async ({ feature }) => ({ data: outputs[feature], model: `fake-${feature}` })),
  };
  return {
    ...buildTestApp({
      envOverrides,
      seed: {
        foodItems: [
          {
            _id: foodId,
            name: "Tofu",
            slug: "tofu",
            status: "active",
            isVegan: true,
            defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
            nutritionPer100g: { caloriesKcal: 100, proteinG: 10, carbsG: 3, fatG: 4 },
          },
        ],
        recipes: [
          {
            _id: recipeId,
            title: "Tofu bowl",
            slug: "tofu-bowl",
            authorId: uid,
            status: "published",
            visibility: "public",
            deletedAt: null,
            servings: 1,
            nutritionPerServing: { caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 5 },
            ingredients: [
              {
                foodItemId: foodId,
                foodNameSnapshot: "Tofu",
                quantity: 200,
                unit: "g",
                gramEquivalent: 200,
                isVegan: true,
              },
            ],
            allergenIds: [],
          },
        ],
        mediaAssets: [
          {
            _id: imageId,
            ownerId: uid,
            kind: "image",
            status: "ready",
            purpose: "ai_ingredient",
            objectKey: "images/tofu.jpg",
            mimeType: "image/jpeg",
            deletedAt: null,
          },
          {
            _id: videoId,
            ownerId: uid,
            kind: "video",
            status: "ready",
            purpose: "other",
            objectKey: "videos/lesson.mp4",
            mimeType: "video/mp4",
            deletedAt: null,
          },
        ],
      },
      overrides: { aiProvider },
      ...options,
    }),
    aiProvider,
  };
}
const auth = (agent, path, token = TEST_TOKENS.user) =>
  agent(path).set("Authorization", `Bearer ${token}`);
describe("AI full HTTP contract with injected feature-specific provider", () => {
  it("all ten AI operations persist resources, enforce ownership and validate inputs", async () => {
    const f = setup(),
      api = request(f.app),
      p = "/api/v1";
    expect((await api.get(`${p}/ai/conversations`)).status).toBe(401);
    expect(
      (
        await auth(api.post.bind(api), `${p}/ai/conversations`).send({
          title: "Food",
          userId: other,
        })
      ).status,
    ).toBe(400);
    let res = await auth(api.post.bind(api), `${p}/ai/conversations`).send({ title: "Food" });
    expect(res.status).toBe(201);
    const c = res.body.data._id;
    res = await auth(api.get.bind(api), `${p}/ai/conversations`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    res = await auth(api.post.bind(api), `${p}/ai/conversations/${c}/messages`).send({
      content: "Dinner ideas?",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.content).toContain("not medical advice");
    res = await auth(api.get.bind(api), `${p}/ai/conversations/${c}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(
      (await auth(api.get.bind(api), `${p}/ai/conversations/${c}/messages`, TEST_TOKENS.other))
        .status,
    ).toBe(404);
    expect(
      (await auth(api.post.bind(api), `${p}/ai/conversations/${c}/messages`).send({ content: "" }))
        .status,
    ).toBe(400);
    res = await auth(api.post.bind(api), `${p}/ai/meal-plan-proposals`).send({
      startDate: "2026-10-05",
      days: 1,
    });
    expect(res.status).toBe(201);
    const proposal = res.body.data.proposalId;
    expect(
      (
        await auth(
          api.post.bind(api),
          `${p}/ai/meal-plan-proposals/${proposal}/confirm`,
          TEST_TOKENS.other,
        ).send({})
      ).status,
    ).toBe(404);
    res = await auth(api.post.bind(api), `${p}/ai/meal-plan-proposals/${proposal}/confirm`).send({
      activate: true,
    });
    expect(res.status).toBe(200);
    const persisted = res.body.data;
    res = await auth(api.post.bind(api), `${p}/ai/meal-plan-proposals/${proposal}/confirm`).send({
      activate: true,
    });
    expect(res.body.data).toEqual(persisted);
    expect(f.repositories.mealPlans.records.size).toBe(1);
    expect(
      (
        await auth(api.post.bind(api), `${p}/ai/meal-plan-proposals`).send({
          startDate: "2026-02-30",
        })
      ).status,
    ).toBe(400);
    res = await auth(api.post.bind(api), `${p}/ai/ingredient-recognition`).send({
      mediaId: imageId,
    });
    expect(res.status).toBe(201);
    const pantry = res.body.data.proposalId,
      runId = res.body.data.runId;
    expect(
      (
        await auth(api.post.bind(api), `${p}/ai/ingredient-recognition`, TEST_TOKENS.other).send({
          mediaId: imageId,
        })
      ).status,
    ).toBeGreaterThanOrEqual(400);
    res = await auth(api.post.bind(api), `${p}/ai/pantry-proposals/${pantry}/confirm`).send({});
    expect(res.status).toBe(200);
    expect(f.repositories.pantries.records.size).toBe(1);
    expect(
      (
        await auth(
          api.post.bind(api),
          `${p}/ai/pantry-proposals/${pantry}/confirm`,
          TEST_TOKENS.other,
        ).send({})
      ).status,
    ).toBe(404);
    res = await auth(api.post.bind(api), `${p}/ai/video-summaries`).send({
      mediaId: videoId,
      transcript: "Cook beans with rice.",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toContain("vegan");
    expect(
      (await auth(api.post.bind(api), `${p}/ai/video-summaries`).send({ mediaId: videoId })).status,
    ).toBe(422);
    res = await auth(api.put.bind(api), `${p}/ai/runs/${runId}/feedback`).send({
      rating: "helpful",
    });
    expect(res.status).toBe(200);
    expect(
      (
        await auth(api.put.bind(api), `${p}/ai/runs/${runId}/feedback`, TEST_TOKENS.other).send({
          rating: "helpful",
        })
      ).status,
    ).toBe(404);
    expect(
      (await auth(api.put.bind(api), `${p}/ai/runs/${runId}/feedback`).send({ rating: "wrong" }))
        .status,
    ).toBe(400);
  });
  it("disabled AI HTTP returns controlled 503 without provider invocation", async () => {
    const f = setup({ envOverrides: { AI_ENABLED: "false" } });
    const res = await auth(
      request(f.app).post.bind(request(f.app)),
      "/api/v1/ai/conversations",
    ).send({ title: "Food" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("AI_DISABLED");
    expect(f.aiProvider.generate).not.toHaveBeenCalled();
  });
});
describe("notifications and reminders full HTTP contract", () => {
  it("all notification operations are owner-scoped, preference validation strict", async () => {
    const f = buildTestApp({
        seed: {
          notifications: [
            {
              _id: imageId,
              userId: uid,
              type: "custom",
              title: "Hi",
              body: "Body",
              readAt: null,
              deletedAt: null,
              status: "sent",
              createdAt: new Date("2026-10-03T11:00:00Z"),
            },
            {
              _id: videoId,
              userId: other,
              type: "custom",
              title: "Other",
              body: "Body",
              readAt: null,
              deletedAt: null,
              status: "sent",
            },
          ],
        },
      }),
      api = request(f.app),
      p = "/api/v1";
    expect((await api.get(`${p}/notifications`)).status).toBe(401);
    let res = await auth(api.get.bind(api), `${p}/notifications`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect((await auth(api.get.bind(api), `${p}/notifications?limit=10000`)).status).toBe(400);
    res = await auth(api.get.bind(api), `${p}/notifications/unread-count`);
    expect(res.body.data.count).toBe(1);
    expect(
      (await auth(api.patch.bind(api), `${p}/notifications/${videoId}/read`).send({})).status,
    ).toBe(404);
    res = await auth(api.patch.bind(api), `${p}/notifications/${imageId}/read`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("read");
    res = await auth(api.post.bind(api), `${p}/notifications/read-all`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
    expect(
      (await auth(api.post.bind(api), `${p}/notifications/read-all`).send({ userId: other }))
        .status,
    ).toBe(400);
    res = await auth(api.delete.bind(api), `${p}/notifications/${imageId}`);
    expect(res.status).toBe(200);
    expect((await auth(api.delete.bind(api), `${p}/notifications/${videoId}`)).status).toBe(404);
    res = await auth(api.get.bind(api), `${p}/notification-preferences`);
    expect(res.status).toBe(200);
    expect(res.body.data.timezone).toBe("UTC");
    res = await auth(api.put.bind(api), `${p}/notification-preferences`).send({
      pushEnabled: false,
      timezone: "America/New_York",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.pushEnabled).toBe(false);
    expect(
      (
        await auth(api.put.bind(api), `${p}/notification-preferences`).send({
          timezone: "Fake/Zone",
        })
      ).status,
    ).toBe(400);
    expect(
      (await auth(api.get.bind(api), `${p}/notification-preferences`, TEST_TOKENS.other)).body.data
        .pushEnabled,
    ).toBe(true);
  });
  it("reminder create/list/patch/cancel with ownership and schedule errors", async () => {
    const f = buildTestApp(),
      api = request(f.app),
      p = "/api/v1/reminders";
    expect((await api.get(p)).status).toBe(401);
    expect(
      (
        await auth(api.post.bind(api), p).send({
          type: "water",
          title: "Water",
          body: "Drink",
          schedule: { mode: "daily", at: "99:00" },
        })
      ).status,
    ).toBe(400);
    let res = await auth(api.post.bind(api), p).send({
      type: "water",
      title: "Water",
      body: "Drink",
      schedule: { mode: "daily", at: "13:00", timezone: "UTC" },
    });
    expect(res.status).toBe(201);
    const id = res.body.data._id;
    expect(res.body.data).not.toHaveProperty("claimKey");
    res = await auth(api.get.bind(api), p);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect((await auth(api.get.bind(api), `${p}?status=invalid`)).status).toBe(400);
    expect(
      (await auth(api.patch.bind(api), `${p}/${id}`, TEST_TOKENS.other).send({ status: "paused" }))
        .status,
    ).toBe(404);
    expect((await auth(api.patch.bind(api), `${p}/${id}`).send({})).status).toBe(400);
    res = await auth(api.patch.bind(api), `${p}/${id}`).send({ status: "paused" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("paused");
    res = await auth(api.delete.bind(api), `${p}/${id}`);
    expect(res.status).toBe(200);
    expect((await auth(api.delete.bind(api), `${p}/${id}`, TEST_TOKENS.other)).status).toBe(404);
    expect((await auth(api.get.bind(api), p)).body.data).toHaveLength(0);
  });
});
