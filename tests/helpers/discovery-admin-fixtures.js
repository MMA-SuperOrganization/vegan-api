import { vi } from "vitest";
import { buildTestApp, TEST_IDS } from "./test-app.js";

export const IDS = Object.freeze({
  recipe: "200000000000000000000001",
  allergicRecipe: "200000000000000000000002",
  hiddenRecipe: "200000000000000000000003",
  privateRecipe: "200000000000000000000004",
  ingredientAllergyRecipe: "200000000000000000000005",
  post: "200000000000000000000006",
  community: "200000000000000000000007",
  video: "200000000000000000000008",
  pending: "200000000000000000000009",
  food: "300000000000000000000001",
  allergicFood: "300000000000000000000002",
  allergen: "400000000000000000000001",
  category: "400000000000000000000002",
  run: "500000000000000000000001",
  feedback: "500000000000000000000002",
  report: "600000000000000000000001",
  otherReport: "600000000000000000000002",
  case: "600000000000000000000003",
  comment: "700000000000000000000001",
  missing: "ffffffffffffffffffffffff",
});
export const WHEN = new Date("2026-10-02T12:00:00Z");
export const actor = { userId: TEST_IDS.user, role: "user", status: "active" };
export const administrator = { userId: TEST_IDS.admin, role: "admin", status: "active" };
export const content = (data = {}) => ({
  title: "Tofu bowl",
  slug: "tofu-bowl",
  authorId: TEST_IDS.user,
  status: "published",
  visibility: "public",
  deletedAt: null,
  publishedAt: WHEN,
  createdAt: WHEN,
  updatedAt: WHEN,
  version: 0,
  tags: ["maintain"],
  categoryIds: [IDS.category],
  allergenIds: [],
  isVegan: true,
  isVegetarian: true,
  nutritionPerServing: { caloriesKcal: 400 },
  ingredients: [
    {
      foodItemId: IDS.food,
      foodNameSnapshot: "Tofu",
      quantity: 100,
      unit: "g",
      gramEquivalent: 100,
      allergenIds: [],
    },
  ],
  totalMinutes: 20,
  difficulty: "easy",
  cuisine: "Vietnamese",
  ...data,
});
export const fixtureSeed = () => ({
  userProfiles: [{ userId: TEST_IDS.user, dietType: "vegan", locale: "en", timezone: "UTC" }],
  nutritionProfiles: [
    {
      userId: TEST_IDS.user,
      allergenIds: [IDS.allergen],
      dailyCalorieTarget: 1800,
      goal: "maintain",
    },
  ],
  pantries: [
    {
      userId: TEST_IDS.user,
      items: [
        {
          itemId: "00000000-0000-4000-8000-000000000001",
          foodItemId: IDS.food,
          quantity: 100,
          unit: "g",
        },
      ],
    },
  ],
  categories: [
    {
      _id: IDS.category,
      name: "Main dish",
      slug: "main-dish",
      type: "recipe",
      status: "active",
      updatedAt: WHEN,
    },
  ],
  allergens: [
    { _id: IDS.allergen, name: "Peanut", slug: "peanut", status: "active", updatedAt: WHEN },
  ],
  foodItems: [
    {
      _id: IDS.food,
      name: "Tofu",
      aliases: ["bean curd"],
      slug: "tofu",
      imageUrl: "https://images.test/tofu.jpg",
      categoryId: IDS.category,
      status: "active",
      isVegan: true,
      isVegetarian: true,
      allergenIds: [],
      nutritionPer100g: { caloriesKcal: 100 },
      createdAt: WHEN,
      updatedAt: WHEN,
    },
    {
      _id: IDS.allergicFood,
      name: "Peanut",
      slug: "peanut",
      status: "active",
      isVegan: true,
      allergenIds: [IDS.allergen],
      createdAt: WHEN,
    },
  ],
  recipes: [
    content({ _id: IDS.recipe }),
    content({ _id: IDS.allergicRecipe, slug: "allergic", allergenIds: [IDS.allergen] }),
    content({ _id: IDS.hiddenRecipe, slug: "hidden", status: "hidden" }),
    content({ _id: IDS.privateRecipe, slug: "private", visibility: "private" }),
    content({
      _id: IDS.ingredientAllergyRecipe,
      slug: "ingredient-allergy",
      ingredients: [{ foodItemId: IDS.allergicFood, quantity: 1 }],
    }),
    content({ _id: IDS.pending, slug: "pending", status: "pending_review" }),
  ],
  posts: [
    content({
      _id: IDS.post,
      slug: "blog",
      title: "Plant based blog",
      postType: "blog",
      content: "Plant based cooking",
      ingredients: [],
    }),
    content({
      _id: IDS.community,
      slug: "community",
      title: "Community cooking",
      postType: "community",
      content: "Community food",
      ingredients: [],
    }),
  ],
  videos: [
    content({
      _id: IDS.video,
      slug: "video",
      title: "Cooking video",
      ingredients: [],
      durationSeconds: 60,
    }),
  ],
  comments: [
    {
      _id: IDS.comment,
      authorId: TEST_IDS.user,
      targetType: "post",
      targetId: IDS.post,
      content: "Useful",
      status: "visible",
      deletedAt: null,
      createdAt: WHEN,
      version: 0,
    },
  ],
  notifications: [
    {
      userId: TEST_IDS.user,
      title: "Hello",
      body: "Private notification",
      status: "sent",
      channel: "in_app",
      readAt: null,
      createdAt: WHEN,
    },
    {
      userId: TEST_IDS.other,
      title: "Other",
      body: "Other notification",
      status: "sent",
      channel: "in_app",
      readAt: null,
      createdAt: WHEN,
    },
  ],
  reports: [
    {
      _id: IDS.report,
      reporterId: TEST_IDS.user,
      targetType: "post",
      targetId: IDS.post,
      reason: "spam",
      description: "private reporter text",
      status: "open",
      createdAt: WHEN,
      version: 0,
    },
    {
      _id: IDS.otherReport,
      reporterId: TEST_IDS.other,
      targetType: "video",
      targetId: IDS.video,
      reason: "spam",
      status: "open",
      createdAt: WHEN,
      version: 0,
    },
  ],
  aiRuns: [
    {
      _id: IDS.run,
      userId: TEST_IDS.user,
      feature: "chat",
      provider: "fake",
      model: "test-model",
      status: "completed",
      latencyMs: 20,
      tokenUsage: { prompt_tokens: 3, completion_tokens: 5, total_tokens: 8 },
      outputMetadata: { validated: true, raw: "private output" },
      inputMetadata: { prompt: "private prompt" },
      errorCode: "SAFE_CODE",
      createdAt: WHEN,
    },
  ],
  aiFeedback: [
    {
      _id: IDS.feedback,
      userId: TEST_IDS.user,
      aiRunId: IDS.run,
      rating: "helpful",
      reason: "private reason",
      comment: "private medical note",
      createdAt: WHEN,
    },
  ],
  auditLogs: [
    {
      actorId: TEST_IDS.admin,
      actorRole: "admin",
      action: "fixture.create",
      targetType: "post",
      targetId: IDS.post,
      before: { token: "secret" },
      after: { status: "published", medicalNotes: "secret" },
      createdAt: WHEN,
    },
  ],
});

// Deliberate aggregate response fixtures, NOT a Mongo aggregation emulator.
// The dedicated unit suite asserts the pipelines; no database/provider is contacted.
export const stubAdvancedAggregates = (repositories, { empty = false } = {}) => {
  const runAggregate = vi.spyOn(repositories.aiRuns, "aggregate").mockResolvedValue(
    empty
      ? []
      : [
          {
            total: 4,
            completed: 2,
            failed: 1,
            blocked: 0,
            pending: 1,
            schemaValid: 2,
            averageLatencyMs: 25,
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
            estimatedCost: 0.01,
          },
        ],
  );
  const feedbackAggregate = vi
    .spyOn(repositories.aiFeedback, "aggregate")
    .mockImplementation(async (pipeline) =>
      pipeline.some((stage) => stage.$facet)
        ? [
            {
              data: empty
                ? []
                : [
                    {
                      _id: IDS.feedback,
                      aiRunId: IDS.run,
                      rating: "helpful",
                      feature: "chat",
                      model: "test-model",
                      createdAt: WHEN,
                    },
                  ],
              total: empty ? [] : [{ count: 1 }],
              summary: empty ? [] : [{ _id: "helpful", count: 1 }],
            },
          ]
        : empty
          ? []
          : [{ total: 2, helpful: 1, runsWithFeedback: 2 }],
    );
  const trendAggregates = Object.fromEntries(
    ["recipes", "posts", "videos", "reports", "users", "auditLogs"].map((key) => {
      const original = repositories[key].aggregate.bind(repositories[key]);
      return [
        key,
        vi
          .spyOn(repositories[key], "aggregate")
          .mockImplementation((pipeline, internal) =>
            pipeline.some((stage) => stage.$group) && !internal?.rows
              ? Promise.resolve(empty ? [] : [{ bucket: WHEN, count: 1 }])
              : original(pipeline, internal),
          ),
      ];
    }),
  );
  return { runAggregate, feedbackAggregate, trendAggregates };
};
export const discoveryApp = (options = {}) => {
  const value = buildTestApp({ ...options, seed: { ...fixtureSeed(), ...options.seed } });
  return { ...value, aggregates: stubAdvancedAggregates(value.repositories) };
};
