import { test as base, expect } from "@playwright/test";
import { once } from "node:events";
import fs from "node:fs";
import yaml from "yaml";
import { buildTestApp, TEST_IDS, TEST_TOKENS } from "../helpers/test-app.js";
import { apiManifest } from "../../src/routes/api-manifest.js";

export { expect, TEST_IDS, TEST_TOKENS };
export const cases = JSON.parse(
  fs.readFileSync(new URL("./cases.json", import.meta.url), "utf8"),
).cases;
export const document = yaml.parse(
  fs.readFileSync(new URL("../../docs/openapi.yaml", import.meta.url), "utf8"),
);
export const NOW = new Date("2026-10-05T12:00:00Z");
export const ID = Object.fromEntries(
  [
    "category",
    "allergen",
    "food",
    "recipe",
    "post",
    "video",
    "image",
    "videoMedia",
    "comment",
    "plan",
    "grocery",
    "diary",
    "weight",
    "water",
    "conversation",
    "proposal",
    "run",
    "notification",
    "reminder",
    "report",
    "moderation",
    "search",
    "history",
    "unusedCategory",
    "unusedAllergen",
    "unusedFood",
  ].map((name, i) => [name, (i + 200).toString(16).padStart(24, "0")]),
);
ID.item = "00000000-0000-4000-8000-000000000001";
ID.meal = "00000000-0000-4000-8000-000000000002";
ID.missing = "ffffffffffffffffffffffff";
export const nutrition = { caloriesKcal: 100, proteinG: 10, carbsG: 10, fatG: 2, fiberG: 2 };
export const food = (extra = {}) => ({
  _id: ID.food,
  name: "Tofu",
  slug: "tofu",
  status: "active",
  categoryId: ID.category,
  allergenIds: [],
  isVegan: true,
  isVegetarian: true,
  containsEggs: false,
  containsDairy: false,
  defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
  nutritionPer100g: nutrition,
  ...extra,
});
export const content = (extra = {}) => ({
  authorId: TEST_IDS.user,
  title: "Đậu hũ Tofu",
  slug: "tofu",
  status: "published",
  visibility: "public",
  deletedAt: null,
  version: 0,
  createdAt: NOW,
  updatedAt: NOW,
  publishedAt: NOW,
  categoryIds: [],
  tags: [],
  mediaIds: [],
  commentCount: 0,
  reactionCount: 0,
  saveCount: 0,
  viewCount: 0,
  ratingCount: 0,
  ratingSum: 0,
  ratingAverage: 0,
  ratingDistribution: {},
  ...extra,
});
export const mealDays = () => [
  {
    date: new Date("2026-10-05T00:00:00Z"),
    meals: [
      {
        mealId: ID.meal,
        type: "lunch",
        recipeId: ID.recipe,
        servings: 1,
        completed: false,
        recipeSnapshot: {
          title: "Tofu",
          servings: 2,
          ingredients: [
            {
              foodItemId: ID.food,
              foodNameSnapshot: "Tofu",
              quantity: 200,
              unit: "g",
              gramEquivalent: 200,
            },
          ],
          nutritionPerServing: nutrition,
        },
      },
    ],
  },
];
export function seed() {
  return {
    userProfiles: [
      {
        userId: TEST_IDS.user,
        gender: "male",
        dateOfBirth: "2000-01-01",
        dietType: "vegan",
        locale: "vi",
        timezone: "Asia/Ho_Chi_Minh",
      },
    ],
    nutritionProfiles: [
      {
        userId: TEST_IDS.user,
        heightCm: 170,
        currentWeightKg: 65,
        goal: "maintain",
        activityLevel: "moderate",
        dailyCalorieTarget: 1800,
        allergenIds: [],
      },
    ],
    categories: [
      { _id: ID.category, name: "Food", slug: "food", type: "food", status: "active" },
      { _id: ID.unusedCategory, name: "Unused", slug: "unused", type: "food", status: "active" },
    ],
    allergens: [
      { _id: ID.allergen, name: "Peanut", slug: "peanut", status: "active" },
      { _id: ID.unusedAllergen, name: "Unused", slug: "unused", status: "active" },
    ],
    foodItems: [food(), food({ _id: ID.unusedFood, name: "Unused", slug: "unused" })],
    recipes: [
      content({
        _id: ID.recipe,
        servings: 2,
        isVegan: true,
        isVegetarian: true,
        allergenIds: [],
        difficulty: "easy",
        totalMinutes: 20,
        ingredients: [
          {
            foodItemId: ID.food,
            foodNameSnapshot: "Tofu",
            quantity: 200,
            unit: "g",
            gramEquivalent: 200,
            allergenIds: [],
            nutritionPer100g: nutrition,
          },
        ],
        steps: [{ order: 1, instruction: "Cook tofu" }],
        nutritionPerServing: nutrition,
      }),
    ],
    posts: [content({ _id: ID.post, content: "Tofu cooking", type: "text" })],
    videos: [
      content({
        _id: ID.video,
        videoMediaId: ID.videoMedia,
        durationSeconds: 60,
        transcript: "Cook tofu",
        chapters: [],
        nutritionPerServing: nutrition,
      }),
    ],
    mediaAssets: [
      {
        _id: ID.image,
        ownerId: TEST_IDS.user,
        objectKey: `users/${TEST_IDS.user}/image`,
        kind: "image",
        purpose: "ai",
        mimeType: "image/jpeg",
        sizeBytes: 100,
        status: "ready",
        references: [],
        deletedAt: null,
        version: 0,
      },
      {
        _id: ID.videoMedia,
        ownerId: TEST_IDS.user,
        objectKey: `users/${TEST_IDS.user}/video`,
        kind: "video",
        purpose: "video",
        mimeType: "video/mp4",
        sizeBytes: 100,
        status: "ready",
        references: [],
        deletedAt: null,
        version: 0,
      },
    ],
    comments: [
      {
        _id: ID.comment,
        authorId: TEST_IDS.user,
        targetType: "recipe",
        targetId: ID.recipe,
        content: "Good tofu",
        status: "visible",
        parentCommentId: null,
        deletedAt: null,
        version: 0,
      },
    ],
    pantries: [
      {
        userId: TEST_IDS.user,
        version: 0,
        items: [
          {
            itemId: ID.item,
            foodItemId: ID.food,
            foodNameSnapshot: "Tofu",
            quantity: 200,
            unit: "g",
            expiresAt: new Date("2026-10-06T12:00:00Z"),
          },
        ],
      },
      { userId: TEST_IDS.other, version: 0, items: [], bulkRequests: [] },
    ],
    mealPlans: [
      {
        _id: ID.plan,
        userId: TEST_IDS.user,
        title: "Week",
        weekStartDate: new Date("2026-10-05T00:00:00Z"),
        status: "draft",
        days: mealDays(),
        version: 0,
        deletedAt: null,
      },
    ],
    groceryLists: [
      {
        _id: ID.grocery,
        userId: TEST_IDS.user,
        name: "Groceries",
        status: "active",
        version: 0,
        deletedAt: null,
        items: [
          {
            itemId: ID.item,
            foodItemId: ID.food,
            nameSnapshot: "Tofu",
            quantity: 100,
            unit: "g",
            checked: true,
          },
        ],
      },
    ],
    diaryEntries: [
      {
        _id: ID.diary,
        userId: TEST_IDS.user,
        date: new Date("2026-10-05T00:00:00Z"),
        mealType: "lunch",
        sourceType: "recipe",
        recipeId: ID.recipe,
        servings: 1,
        nutritionSnapshot: nutrition,
        nutritionBasis: nutrition,
        basisQuantity: 1,
        basisUnit: "serving",
        deletedAt: null,
      },
    ],
    weightLogs: [{ _id: ID.weight, userId: TEST_IDS.user, date: "2026-10-05", weightKg: 65 }],
    waterLogs: [
      { _id: ID.water, userId: TEST_IDS.user, date: "2026-10-05", amountMl: 250, loggedAt: NOW },
    ],
    aiConversations: [
      {
        _id: ID.conversation,
        userId: TEST_IDS.user,
        title: "Meals",
        status: "active",
        createdAt: NOW,
      },
    ],
    aiMessages: [
      {
        conversationId: ID.conversation,
        userId: TEST_IDS.user,
        role: "assistant",
        content: "Tofu",
      },
    ],
    aiRuns: [
      {
        _id: ID.run,
        userId: TEST_IDS.user,
        feature: "chat",
        status: "completed",
        latencyMs: 100,
        createdAt: NOW,
        inputMetadata: {},
        outputMetadata: {},
      },
    ],
    aiProposals: [
      {
        _id: ID.proposal,
        userId: TEST_IDS.user,
        type: "meal_plan",
        status: "pending",
        startDate: "2026-10-05",
        expiresAt: new Date(NOW.getTime() + 3600000),
        structuredData: {
          title: "Week",
          days: [
            { date: "2026-10-05", meals: [{ slot: "lunch", recipeId: ID.recipe, servings: 1 }] },
          ],
        },
      },
    ],
    notifications: [
      {
        _id: ID.notification,
        userId: TEST_IDS.user,
        title: "Eat",
        body: "Tofu",
        type: "system",
        readAt: null,
        createdAt: NOW,
      },
    ],
    reminders: [
      {
        _id: ID.reminder,
        userId: TEST_IDS.user,
        type: "meal",
        title: "Eat",
        body: "Tofu",
        status: "active",
        version: 0,
        schedule: { mode: "once", at: "2026-10-06T08:00:00+07:00", timezone: "Asia/Ho_Chi_Minh" },
        nextRunAt: new Date("2026-10-06T01:00:00Z"),
        lockedAt: null,
        lockedBy: null,
        lockExpiresAt: null,
        claimKey: null,
      },
    ],
    reports: [
      {
        _id: ID.report,
        reporterId: TEST_IDS.user,
        targetType: "recipe",
        targetId: ID.recipe,
        reason: "spam",
        status: "open",
        createdAt: NOW,
      },
    ],
    moderation: [
      {
        _id: ID.moderation,
        targetType: "recipe",
        targetId: ID.recipe,
        reportIds: [ID.report],
        status: "open",
        priority: "normal",
        createdAt: NOW,
      },
    ],
    searchHistory: [
      {
        _id: ID.search,
        userId: TEST_IDS.user,
        q: "Tofu",
        query: "Tofu",
        normalizedQuery: "tofu",
        lastSearchedAt: NOW,
      },
    ],
    viewHistories: [
      {
        _id: ID.history,
        userId: TEST_IDS.user,
        targetType: "recipe",
        targetId: ID.recipe,
        lastViewedAt: NOW,
      },
    ],
  };
}
export const aiProvider = () => ({
  enabled: true,
  provider: "fake",
  model: "fake",
  calls: [],
  async generate(input) {
    this.calls.push(input);
    const outputs = {
      chat: { content: "Hãy ăn đa dạng thực phẩm chay." },
      meal_plan: {
        title: "Week",
        days: [
          { date: "2026-10-05", meals: [{ slot: "lunch", recipeId: ID.recipe, servings: 1 }] },
        ],
      },
      ingredient_recognition: {
        items: [{ foodItemId: ID.food, name: "Tofu", quantity: 100, unit: "g" }],
      },
      video_summary: { summary: "Cook tofu", keyPoints: ["Use tofu"] },
    };
    return { data: outputs[input.feature], model: "fake" };
  },
});

export async function openHarness(playwright, options = {}) {
  let time = new Date(options.now ?? NOW);
  const provider = options.aiProvider ?? aiProvider();
  const context = buildTestApp({
    seed: options.seed ?? seed(),
    clock: () => time,
    envOverrides: {
      AI_ENABLED: "true",
      AI_API_KEY: "offline-test-key",
      AI_BASE_URL: "https://offline.invalid/v1",
      AI_CHAT_MODEL: "offline-chat",
      AI_VISION_MODEL: "offline-vision",
      VIDEOS_ENABLED: "true",
      ...options.envOverrides,
    },
    overrides: { aiProvider: provider, ...options.overrides },
  });
  const server = context.app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const http = await playwright.request.newContext({
    baseURL: `http://127.0.0.1:${server.address().port}`,
  });
  const harness = {
    ...context,
    http,
    provider,
    advance: (ms) => {
      time = new Date(time.getTime() + ms);
    },
    snapshot: () =>
      Object.fromEntries(
        Object.entries(context.repositories).map(([key, repo]) => [
          key,
          structuredClone([...repo.records.values()]),
        ]),
      ),
    async close() {
      await http.dispose();
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
    async call(operationId, { params = {}, query = {}, body, token, status } = {}) {
      const route = apiManifest.find((r) => r.operationId === operationId);
      if (!route) throw new Error(`Unknown operation ${operationId}`);
      const defaults = requestFor(route);
      const path = route.path.replace(
        /:([A-Za-z]+)/g,
        (_, key) => ({ ...defaults.params, ...params })[key],
      );
      const auth =
        token === undefined
          ? route.auth === "admin"
            ? TEST_TOKENS.admin
            : TEST_TOKENS.user
          : token;
      const response = await http.fetch(`/api/v1${path}`, {
        method: route.method,
        params: { ...defaults.query, ...query },
        headers: auth ? { Authorization: `Bearer ${auth}` } : {},
        ...(["POST", "PUT", "PATCH", "DELETE"].includes(route.method)
          ? { data: body ?? defaults.body }
          : {}),
      });
      const json = await response.json();
      if (status !== undefined)
        expect(response.status(), `${operationId}: ${JSON.stringify(json)}`).toBe(status);
      return { status: response.status(), body: json, response, data: json.data };
    },
  };
  return harness;
}
export const test = base.extend({
  h: async ({ playwright }, use) => {
    const h = await openHarness(playwright);
    try {
      await use(h);
    } finally {
      await h.close();
    }
  },
});

const keyId = (route) => {
  const p = route.path;
  if (p.startsWith("/admin/users")) return TEST_IDS.other;
  if (p.startsWith("/admin/ai/runs")) return ID.run;
  if (p.includes("moderation-cases")) return ID.moderation;
  if (p.includes("reports")) return ID.report;
  if (p.includes("search/recent")) return ID.search;
  if (p.includes("categories")) return route.method === "DELETE" ? ID.unusedCategory : ID.category;
  if (p.includes("allergens")) return route.method === "DELETE" ? ID.unusedAllergen : ID.allergen;
  if (p.includes("food-items")) return route.method === "DELETE" ? ID.unusedFood : ID.food;
  if (p.includes("meal-plans")) return ID.plan;
  if (p.includes("grocery-lists")) return ID.grocery;
  if (p.includes("diary")) return ID.diary;
  if (p.includes("weight-logs")) return ID.weight;
  if (p.includes("water-logs")) return ID.water;
  if (p.includes("conversations")) return ID.conversation;
  if (p.includes("media")) return ID.image;
  if (p.includes("posts")) return ID.post;
  if (p.includes("videos")) return ID.video;
  if (p.includes("comments")) return ID.comment;
  if (p.includes("notifications")) return ID.notification;
  if (p.includes("reminders")) return ID.reminder;
  return ID.recipe;
};
export function requestFor(route) {
  const operation =
    document.paths[route.path.replace(/:([A-Za-z]+)/g, "{$1}")][route.method.toLowerCase()];
  const examples = operation.requestBody?.content?.["application/json"]?.examples;
  let body = structuredClone(examples ? Object.values(examples)[0].value : {});
  const replacements = {
    foodItemId: ID.food,
    categoryId: ID.category,
    recipeId: ID.recipe,
    targetId: ID.recipe,
    mediaId: ID.image,
    videoMediaId: ID.videoMedia,
    reportIds: [ID.report],
    allergenIds: [],
  };
  const replace = (value) =>
    Array.isArray(value)
      ? value.map(replace)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, replacements[k] ?? replace(v)]),
          )
        : value;
  body = replace(body);
  const query = Object.fromEntries(
    (operation.parameters ?? [])
      .filter((p) => p.in === "query" && p.required)
      .map((p) => [p.name, replacements[p.name] ?? p.example ?? p.schema.default]),
  );
  const bodies = {
    createMealPlan: {
      title: "Week",
      weekStartDate: "2026-10-05",
      days: [{ date: "2026-10-05", meals: [{ type: "lunch", recipeId: ID.recipe, servings: 1 }] }],
    },
    addMealToPlan: { date: "2026-10-06", type: "dinner", recipeId: ID.recipe, servings: 1 },
    cloneMealPlan: { weekStartDate: "2026-10-12" },
    createMealPlanProposal: { startDate: "2026-10-05", days: 1 },
    generateVideoSummary: { mediaId: ID.videoMedia, transcript: "Cook tofu" },
    createReminder: {
      type: "meal",
      title: "Eat",
      body: "Tofu",
      schedule: { mode: "once", at: "2026-10-06T08:00:00+07:00" },
    },
    createRecipe: {
      title: "Created tofu",
      servings: 2,
      ingredients: [{ foodItemId: ID.food, quantity: 200, unit: "g" }],
      steps: [{ order: 1, instruction: "Cook tofu" }],
    },
    createReport: { targetType: "post", targetId: ID.post, reason: "spam" },
  };
  return {
    body: bodies[route.operationId] ?? body,
    query,
    params: {
      id: keyId(route),
      idOrSlug: keyId(route),
      userId: TEST_IDS.user,
      targetType: "recipe",
      targetId: ID.recipe,
      itemId: ID.item,
      mealId: ID.meal,
      proposalId: ID.proposal,
      runId: ID.run,
      tokenId: ID.item,
    },
  };
}

export async function prepare(h, route) {
  const op = route.operationId;
  const repo = h.repositories;
  if (op === "removeFcmToken")
    await repo.users.updateOne(
      { _id: TEST_IDS.user },
      { $set: { fcmTokens: [{ tokenId: ID.item, token: "fcm-test", platform: "android" }] } },
    );
  if (["updateRecipe", "updatePost", "updateVideo"].includes(op))
    await repo[
      op === "updateRecipe" ? "recipes" : op === "updatePost" ? "posts" : "videos"
    ].updateOne({ _id: keyId(route) }, { $set: { status: "draft" } });
  if (/^(submit|publish|reject)(Recipe|Post|Video)$/.test(op)) {
    const name = op.endsWith("Recipe") ? "recipes" : op.endsWith("Post") ? "posts" : "videos";
    await repo[name].updateOne(
      { _id: keyId(route) },
      { $set: { status: op.startsWith("submit") ? "draft" : "pending_review" } },
    );
  }
  if (op === "submitRecipe")
    await repo.recipes.updateOne(
      { _id: ID.recipe },
      { $set: { description: "Tofu recipe", prepMinutes: 10, cookMinutes: 10 } },
    );
  if (op === "deleteComment")
    await repo.recipes.updateOne({ _id: ID.recipe }, { $set: { commentCount: 1 } });
  if (op === "createModerationCase") repo.moderation.records.clear();
  if (op === "createVideo")
    await repo.mediaAssets.updateOne({ _id: ID.videoMedia }, { $set: { references: [] } });
  if (op === "confirmMediaUpload") {
    await repo.mediaAssets.updateOne(
      { _id: ID.image },
      { $set: { status: "pending", uploadExpiresAt: new Date(NOW.getTime() + 300000) } },
    );
    h.storageProvider.objects.set(`users/${TEST_IDS.user}/image`, {
      contentType: "image/jpeg",
      contentLength: 100,
    });
  }
  if (op === "confirmPantryProposal")
    await repo.aiProposals.updateOne(
      { _id: ID.proposal },
      {
        $set: {
          type: "pantry",
          structuredData: {
            items: [{ foodItemId: ID.food, name: "Tofu", quantity: 100, unit: "g" }],
          },
        },
      },
    );
  if (op === "getCurrentMealPlan") {
    await h.call("activateMealPlan", { status: 200 });
  }
  if (op === "restoreContent")
    await repo.recipes.updateOne(
      { _id: ID.recipe },
      { $set: { status: "hidden", statusBeforeHidden: "published" } },
    );
  if (op === "activateUser")
    await repo.users.updateOne({ _id: TEST_IDS.other }, { $set: { status: "suspended" } });
  if (op === "completeOnboarding")
    await h.call("updateOnboarding", {
      body: {
        dietType: "vegan",
        allergenIds: [],
        heightCm: 170,
        currentWeightKg: 65,
        activityLevel: "moderate",
        goal: "maintain",
      },
      status: 200,
    });
}
