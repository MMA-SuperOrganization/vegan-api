import { z } from "zod";
import { createContainer } from "../container.js";
import { loadEnv } from "../config/env.js";
import { apiManifest } from "../routes/api-manifest.js";
import { CREATED } from "../routes/index.js";
import { chatOutput, mealPlanOutput, pantryOutput, summaryOutput } from "../modules/ai/index.js";

// Construction only: no queries, provider initialization, server, timers or process.env.
export const createContractContainer = () =>
  createContainer({
    env: loadEnv({ NODE_ENV: "test", LOG_LEVEL: "silent", SWAGGER_ENABLED: "false" }),
    logger: { warn() {}, error() {}, info() {} },
    overrides: {
      authProvider: null,
      storageProvider: null,
      aiProvider: null,
      messagingProvider: null,
    },
  });
export const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const string = { type: "string" };
const number = { type: "number" };
const boolean = { type: "boolean" };
const count = { type: "integer", minimum: 0 };
const id = { type: "string", pattern: "^[a-fA-F0-9]{24}$" };
const date = { type: "string", format: "date-time" };
const array = (items) => ({ type: "array", items });
const nullable = (schema) => ({ anyOf: [schema, { type: "null" }] });
const object = (properties, required = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const empty = object({});
const dictionary = (values) => ({ type: "object", additionalProperties: values });
const extend = (schema, properties, required = []) => ({
  ...schema,
  properties: { ...schema.properties, ...properties },
  required: [...new Set([...(schema.required ?? []), ...required])],
});
const project = (schema, keys) => ({
  ...schema,
  properties: Object.fromEntries(
    keys.filter((key) => schema.properties[key]).map((key) => [key, schema.properties[key]]),
  ),
  required: (schema.required ?? []).filter((key) => keys.includes(key)),
});
const omit = (schema, keys) =>
  project(
    schema,
    Object.keys(schema.properties).filter((key) => !keys.includes(key)),
  );

export function convertValidator(schema) {
  // Input mode describes wire payloads before coercion/deduplication. Native Zod
  // throws on unsupported schemas; deliberately no unrepresentable:any fallback.
  const { $schema, ...converted } = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-2020-12",
  });
  return converted;
}

function modelSchema(model) {
  const result = model.schema.toJSONSchema();
  function enrich(schema, mongooseSchema) {
    schema.additionalProperties = false;
    for (const [key, field] of Object.entries(mongooseSchema.paths)) {
      const property = schema.properties?.[key];
      if (!property) continue;
      if (field.instance === "Mixed") schema.properties[key] = ref("JsonValue");
      else if (field.instance === "Date") property.format = "date-time";
      else if (field.schema) {
        const child = field.instance === "Array" ? property.items : property;
        if (!child) throw new Error(`Unsupported subdocument: ${model.modelName}.${key}`);
        enrich(child, field.schema);
      }
      if (field.options.min != null) property.minimum = field.options.min;
      if (field.options.max != null) property.maximum = field.options.max;
      if (field.options.maxlength != null) property.maxLength = field.options.maxlength;
    }
  }
  enrich(result, model.schema);
  return result;
}

export const dedicatedTests = {
  health: "tests/integration/app.test.js",
  auth: "tests/integration/identity-http.test.js",
  users: "tests/integration/identity-http.test.js",
  "nutrition-profiles": "tests/integration/identity-http.test.js",
  onboarding: "tests/integration/identity-http.test.js",
  categories: "tests/integration/identity-http.test.js",
  allergens: "tests/integration/identity-http.test.js",
  "food-items": "tests/integration/identity-http.test.js",
  recipes: "tests/integration/content-complete.test.js",
  posts: "tests/integration/content-complete.test.js",
  videos: "tests/integration/content-complete.test.js",
  media: "tests/integration/content-complete.test.js",
  comments: "tests/integration/content-complete.test.js",
  reactions: "tests/integration/content-complete.test.js",
  ratings: "tests/integration/content-complete.test.js",
  "saved-items": "tests/integration/content-complete.test.js",
  "view-history": "tests/integration/content-complete.test.js",
  pantries: "tests/unit/planning.http.test.js",
  "meal-plans": "tests/unit/planning.http.test.js",
  "grocery-lists": "tests/unit/planning.http.test.js",
  diary: "tests/unit/planning.http.test.js",
  "weight-logs": "tests/unit/planning.http.test.js",
  "water-logs": "tests/unit/planning.http.test.js",
  ai: "tests/unit/ai-notifications-http-complete.test.js",
  notifications: "tests/unit/ai-notifications-http-complete.test.js",
  reminders: "tests/unit/ai-notifications-http-complete.test.js",
  "app-config": "tests/integration/discovery-admin-http.test.js",
  home: "tests/integration/discovery-admin-http.test.js",
  search: "tests/integration/discovery-admin-http.test.js",
  recommendations: "tests/integration/discovery-admin-http.test.js",
  "admin-dashboard": "tests/integration/discovery-admin-http.test.js",
  "ai-monitoring": "tests/integration/discovery-admin-http.test.js",
  reports: "tests/integration/discovery-admin-http.test.js",
  moderation: "tests/integration/discovery-admin-http.test.js",
  "audit-logs": "tests/integration/discovery-admin-http.test.js",
};

export function createContractRegistry(container = createContractContainer()) {
  const schemas = {
    // Mixed fields are genuinely JSON metadata in the persistence models, not
    // fabricated free-form response envelopes. This recursive schema constrains
    // them to serializable JSON while retaining their actual extensible shape.
    JsonValue: {
      anyOf: [
        { type: "null" },
        string,
        number,
        boolean,
        array(ref("JsonValue")),
        dictionary(ref("JsonValue")),
      ],
    },
    EmptyObject: empty,
    RequestMeta: object({ requestId: nullable(string) }),
    PaginationMeta: object({
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1 },
      total: count,
      totalPages: count,
      requestId: nullable(string),
    }),
    ValidationDetail: object({ path: string, code: string, message: string, field: string }, []),
    ErrorEnvelope: object({
      success: { const: false, type: "boolean" },
      error: object({ code: string, message: string, details: ref("JsonValue") }),
      meta: ref("RequestMeta"),
    }),
    TokenUsage: object({ inputTokens: count, outputTokens: count, totalTokens: count }),
  };
  const modelNames = {};
  for (const [key, model] of Object.entries(container.models)) {
    if (["adminGuards", "MealPlanActiveSlotsModel"].includes(key)) continue; // Internal serialization guards, never API entities.
    modelNames[key] = model.modelName;
    schemas[model.modelName] = modelSchema(model);
  }
  const entity = (key) => {
    if (!modelNames[key]) throw new Error(`Unregistered response model: ${key}`);
    return ref(key === "foodItems" ? "PublicFoodItem" : modelNames[key]);
  };
  const model = (key) => schemas[modelNames[key]];
  schemas.PublicFoodItem = omit(model("foodItems"), ["normalizedName", "createdBy", "updatedBy"]);
  schemas.Account = extend(
    project(model("users"), [
      "_id",
      "email",
      "displayName",
      "avatarUrl",
      "avatarMediaId",
      "role",
      "status",
      "onboardingCompleted",
      "lastLoginAt",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ]),
    { userId: id, avatarUrl: nullable(string), avatarMediaId: nullable(id), avatarExpiresAt: date },
    ["userId"],
  );
  schemas.PublicUser = object(
    {
      userId: id,
      displayName: string,
      avatarUrl: nullable(string),
      avatarMediaId: nullable(id),
      avatarExpiresAt: date,
      bio: string,
      dietType: string,
      preferredCuisines: array(string),
    },
    ["userId"],
  );
  schemas.NutritionProfile = extend(
    omit(model("nutritionProfiles"), ["manualTargetFields"]),
    { isEstimate: { const: true, type: "boolean" }, disclaimer: string },
    ["isEstimate", "disclaimer"],
  );
  schemas.ProfileSummary = object({
    user: ref("Account"),
    profile: nullable(entity("userProfiles")),
    nutritionProfile: nullable(ref("NutritionProfile")),
  });
  schemas.OnboardingStatus = object({
    completed: boolean,
    readyToComplete: boolean,
    missingFields: array(string),
    steps: array(object({ key: string, completed: boolean })),
  });
  schemas.AppConfig = object({
    versionPolicy: object({ minimum: string, latest: string, forceUpdate: boolean }),
    enums: object({
      dietTypes: array(string),
      units: array(string),
      contentTypes: array(string),
      reportReasons: array(string),
    }),
    limits: object({
      pageSize: count,
      homeSectionSize: count,
      searchSuggestions: count,
      recentSearches: count,
    }),
    features: object({ ai: boolean, videos: boolean, community: boolean }),
  });
  schemas.Bootstrap = object({
    config: ref("AppConfig"),
    auth: object(
      {
        authenticated: boolean,
        user: object({ id, displayName: string, avatarMediaId: id, role: string, status: string }, [
          "id",
          "role",
          "status",
        ]),
      },
      ["authenticated"],
    ),
    onboarding: nullable(ref("OnboardingStatus")),
    unreadCount: count,
    masterDataVersions: object({ categories: string, allergens: string, foodItems: string }),
  });
  const summaryKeys = [
    "_id",
    "id",
    "slug",
    "title",
    "description",
    "excerpt",
    "coverMediaId",
    "thumbnailMediaId",
    "categoryIds",
    "tags",
    "dietTypes",
    "allergenIds",
    "difficulty",
    "totalMinutes",
    "totalTimeMinutes",
    "nutritionPerServing",
    "publishedAt",
    "createdAt",
    "authorId",
    "ratingAverage",
    "ratingCount",
    "viewCount",
    "durationSeconds",
  ];
  schemas.ContentSummary = {
    anyOf: ["recipes", "posts", "videos"].map((key) => project(model(key), summaryKeys)),
  };
  schemas.Recommendation = object({
    score: number,
    reasons: array(string),
    pantryMatch: object({ matched: count, total: count }),
    allergenExclusionsApplied: boolean,
  });
  schemas.RecommendedContent = {
    anyOf: ["recipes", "posts", "videos"].map((key) =>
      extend(
        project(model(key), summaryKeys),
        { type: string, recommendation: ref("Recommendation") },
        ["type", "recommendation"],
      ),
    ),
  };
  schemas.HomeFeed = object({
    featured: object({
      recipes: array(ref("ContentSummary")),
      videos: array(ref("ContentSummary")),
      posts: array(ref("ContentSummary")),
    }),
    personalized: nullable(object({ recipes: array(ref("RecommendedContent")) })),
  });
  schemas.SearchResult = {
    anyOf: ["recipes", "posts", "videos"]
      .map((key) => extend(project(model(key), summaryKeys), { type: string }, ["type"]))
      .concat(
        extend(
          project(model("foodItems"), [
            "_id",
            "name",
            "slug",
            "categoryId",
            "allergenIds",
            "isVegan",
            "nutritionPer100g",
            "createdAt",
          ]),
          { type: { const: "food-item", type: "string" } },
          ["type"],
        ),
      ),
  };
  schemas.MediaAsset = extend(
    project(model("mediaAssets"), [
      "_id",
      "ownerId",
      "kind",
      "purpose",
      "mimeType",
      "sizeBytes",
      "status",
      "confirmedAt",
      "createdAt",
      "updatedAt",
    ]),
    { url: string, downloadUrl: string, expiresAt: date },
  );
  const rating = object(
    { score: { type: "integer", minimum: 1, maximum: 5 }, review: nullable(string) },
    ["score"],
  );
  const userState = { saved: boolean, reacted: nullable(string), rating: nullable(rating) };
  for (const key of ["recipes", "posts", "videos"]) {
    const name = modelNames[key];
    schemas[`${name}Content`] = omit(model(key), ["ratingSum", "viewReceipts"]);
    schemas[`${name}Detail`] = extend(
      schemas[`${name}Content`],
      {
        ...userState,
        ...(key === "videos"
          ? {
              playback: ref("MediaAsset"),
              progress: nullable(
                object({
                  progressSeconds: number,
                  completed: boolean,
                  lastProgressAt: nullable(date),
                }),
              ),
            }
          : {}),
      },
      key === "videos" ? ["playback"] : [],
    );
  }
  schemas.Pantry = omit(model("PantriesModel"), ["bulkRequests"]);
  schemas.DiaryEntry = omit(model("DiaryModel"), ["nutritionBasis", "basisQuantity", "basisUnit"]);
  schemas.HistoryEntry = extend(model("viewHistories"), {
    target: nullable({ anyOf: [ref("RecipesContent"), ref("PostsContent"), ref("VideosContent")] }),
    unavailable: boolean,
  });
  schemas.RecordedView = extend(model("viewHistories"), { counted: boolean }, ["counted"]);
  const nutrition = model("recipes").properties.nutritionPerServing;
  const range = object({ from: date, to: date });
  const bucket = object({ bucket: date, count });
  schemas.AiMetrics = object({
    range,
    runs: object({ total: count, completed: count, failed: count, blocked: count, pending: count }),
    successRate: nullable(number),
    schemaValidRate: nullable(number),
    averageLatencyMs: nullable(number),
    usage: extend(schemas.TokenUsage, { estimatedCost: number }, ["estimatedCost"]),
    feedback: object({
      count,
      helpful: count,
      helpfulRate: nullable(number),
      coverageRate: nullable(number),
    }),
    definitions: object({
      successRate: string,
      schemaValidRate: string,
      feedbackCoverage: string,
      helpfulRate: string,
      accuracyAvailable: { const: false, type: "boolean" },
    }),
  });
  schemas.SafeAiRun = extend(
    project(model("aiRuns"), [
      "_id",
      "feature",
      "provider",
      "model",
      "status",
      "latencyMs",
      "estimatedCost",
      "errorCode",
      "createdAt",
      "updatedAt",
    ]),
    { tokenUsage: ref("TokenUsage"), schemaValid: boolean },
    ["tokenUsage", "schemaValid"],
  );
  schemas.SafeAiFeedback = extend(
    project(model("aiFeedback"), ["_id", "aiRunId", "rating", "createdAt", "updatedAt"]),
    { feature: string, model: string },
  );
  schemas.AiMealPlanOutput = convertValidator(mealPlanOutput);
  schemas.AiPantryOutput = convertValidator(pantryOutput);
  schemas.AiSummaryOutput = convertValidator(summaryOutput);
  schemas.AiChatOutput = convertValidator(chatOutput);
  const proposalFields = {
    proposalId: id,
    runId: id,
    status: { const: "pending", type: "string" },
    expiresAt: date,
    disclaimer: string,
  };
  schemas.MealPlanProposal = extend(
    schemas.AiMealPlanOutput,
    proposalFields,
    Object.keys(proposalFields),
  );
  schemas.PantryProposal = extend(
    schemas.AiPantryOutput,
    proposalFields,
    Object.keys(proposalFields),
  );
  schemas.VideoSummary = extend(schemas.AiSummaryOutput, { runId: id, disclaimer: string }, [
    "runId",
    "disclaimer",
  ]);
  schemas.AiChatMessage = extend(model("aiMessages"), { runId: id, disclaimer: string }, [
    "runId",
    "disclaimer",
  ]);

  const responses = {};
  const assign = (ids, data, meta = ref("RequestMeta")) => {
    for (const operationId of ids.split(" ")) {
      if (responses[operationId]) throw new Error(`Duplicate response contract: ${operationId}`);
      responses[operationId] = { data, meta };
    }
  };
  const list = (ids, item, extraMeta) =>
    assign(
      ids,
      array(item),
      extraMeta ? extend(schemas.PaginationMeta, extraMeta) : ref("PaginationMeta"),
    );
  assign(
    "checkLiveness",
    object({ app: string, version: string, timestamp: date, uptimeSeconds: count }),
  );
  assign(
    "checkReadiness",
    object({ status: { const: "ready", type: "string" }, database: string, timestamp: date }),
  );
  assign("getAppConfig", ref("AppConfig"));
  assign("bootstrapApp", ref("Bootstrap"));
  assign("getHomeFeed", ref("HomeFeed"));
  assign("getOnboardingStatus updateOnboarding completeOnboarding", ref("OnboardingStatus"));
  assign("syncAuth updateMyProfile suspendUser activateUser changeUserRole", ref("Account"));
  assign("getMe getMyProfileSummary", ref("ProfileSummary"));
  assign(
    "addFcmToken",
    object(
      {
        tokenId: { type: "string", format: "uuid" },
        platform: { const: "android", type: "string" },
        deviceName: string,
        lastUsedAt: date,
      },
      ["tokenId", "platform", "lastUsedAt"],
    ),
  );
  assign("removeFcmToken", object({ tokenId: string, removed: boolean }));
  assign(
    "deleteMyAccount",
    object({ userId: id, status: { const: "deleted", type: "string" }, deletedAt: date }),
  );
  assign("getPublicUserProfile", ref("PublicUser"));
  list("getMyContent", { anyOf: [entity("recipes"), entity("posts"), entity("videos")] });
  assign(
    "getMyActivity",
    object({
      userId: id,
      counts: object(
        Object.fromEntries(
          [
            "recipes",
            "posts",
            "videos",
            "comments",
            "reactions",
            "savedItems",
            "ratings",
            "viewHistories",
          ].map((key) => [key, count]),
        ),
      ),
    }),
  );
  assign("getMyFullProfile", { anyOf: [entity("userProfiles"), ref("EmptyObject")] });
  assign("upsertMyProfile", entity("userProfiles"));
  assign("getMyNutritionProfile", { anyOf: [ref("NutritionProfile"), ref("EmptyObject")] });
  assign("upsertMyNutritionProfile recalculateNutritionTarget", ref("NutritionProfile"));
  list("getAdminUsers", ref("Account"));
  assign(
    "getAdminUserDetail",
    object({
      user: ref("Account"),
      profile: project(model("userProfiles"), ["bio", "dietType", "locale", "timezone"]),
    }),
  );
  for (const [key, singular, listId] of [
    ["categories", "Category", "getCategories"],
    ["allergens", "Allergen", "getAllergens"],
    ["foodItems", "FoodItem", "searchFoodItems"],
  ]) {
    list(listId, entity(key));
    assign(`create${singular} update${singular} delete${singular}`, entity(key));
  }
  assign("getFoodItem", entity("foodItems"));
  for (const [key, singular, ids] of [
    ["recipes", "Recipe", "getRecipes getMyRecipes"],
    ["posts", "Post", "getPosts getMyPosts"],
    ["videos", "Video", "getVideos getMyVideos"],
  ]) {
    list(ids, ref(`${modelNames[key]}Content`));
    assign(`get${singular}`, ref(`${modelNames[key]}Detail`));
    assign(
      `create${singular} update${singular} delete${singular} submit${singular} publish${singular} reject${singular}`,
      ref(`${modelNames[key]}Content`),
    );
  }
  assign(
    "getRecipeNutrition",
    object({
      recipeId: id,
      servings: number,
      nutritionPerServing: nutrition,
      allergenIds: array(id),
    }),
  );
  list("searchContent", ref("SearchResult"));
  assign(
    "getSearchSuggestions",
    array(object({ id, type: string, text: string, slug: string }, ["id", "type", "text"])),
  );
  list("getRecentSearches", entity("searchHistory"));
  assign("clearRecentSearches", object({ deletedCount: count }));
  assign("deleteRecentSearch", object({ deleted: boolean }));
  list(
    "discoverContent getRecipeRecommendations getContentRecommendations",
    ref("RecommendedContent"),
    { candidateLimitPerType: count, ranking: string },
  );
  assign(
    "getPantry addPantryItem addPantryItemsBulk updatePantryItem deletePantryItem",
    ref("Pantry"),
  );
  list("getExpiringPantryItems", schemas.Pantry.properties.items.items);
  list(
    "getPantryRecipeSuggestions",
    object({
      recipe: entity("recipes"),
      matchRatio: number,
      matchedCount: count,
      sufficientCount: count,
      missingIngredients: model("recipes").properties.ingredients,
    }),
    { evaluated: count },
  );
  list("getMealPlans", entity("MealPlansModel"));
  assign("getCurrentMealPlan", { anyOf: [entity("MealPlansModel"), ref("EmptyObject")] });
  assign(
    "getMealPlan createMealPlan updateMealPlan deleteMealPlan addMealToPlan updateMealInPlan deleteMealFromPlan activateMealPlan cloneMealPlan",
    entity("MealPlansModel"),
  );
  assign(
    "generateGroceryListFromPlan getGroceryList createGroceryList updateGroceryList deleteGroceryList addGroceryItem updateGroceryItem deleteGroceryItem clearCheckedGroceryItems",
    entity("GroceryListsModel"),
  );
  list("getGroceryLists", entity("GroceryListsModel"));
  list("getDiaryEntries", ref("DiaryEntry"));
  assign("createDiaryEntry updateDiaryEntry", ref("DiaryEntry"));
  assign("deleteDiaryEntry deleteWeightLog deleteWaterLog", object({ id, deleted: boolean }));
  const targetNutrients = ["caloriesKcal", "proteinG", "carbsG", "fatG", "fiberG"];
  const nullableNumber = { anyOf: [number, { type: "null" }] };
  const targetComparison = object(
    Object.fromEntries(
      targetNutrients.map((key) => [
        key,
        object({
          consumed: number,
          target: nullableNumber,
          remaining: nullableNumber,
          percentage: nullableNumber,
        }),
      ]),
    ),
  );
  assign(
    "getDiarySummary",
    object({
      from: string,
      to: string,
      days: array(object({ date: string, entryCount: count, nutrition, targetComparison })),
      entryCount: count,
      nutrition,
      dailyTargets: object(Object.fromEntries(targetNutrients.map((key) => [key, nullableNumber]))),
      targetComparison,
    }),
  );
  list("getWeightLogs", entity("WeightLogsModel"));
  assign("createWeightLog updateWeightLog", entity("WeightLogsModel"));
  assign(
    "getWeightTrend",
    object({
      from: string,
      to: string,
      timezone: string,
      points: array(
        object({
          date: string,
          count,
          averageWeightKg: number,
          firstWeightKg: number,
          latestWeightKg: number,
          firstRecordedAt: date,
          latestRecordedAt: date,
        }),
      ),
      count,
      startWeightKg: nullable(number),
      endWeightKg: nullable(number),
      changeKg: nullable(number),
      changePercent: nullable(number),
      averageChangeKgPerDay: nullable(number),
    }),
  );
  list("getWaterLogs", entity("WaterLogsModel"), {
    from: string,
    to: string,
    timezone: string,
    totalMl: number,
    count,
    days: array(object({ date: string, amountMl: number, count })),
  });
  assign("createWaterLog updateWaterLog", entity("WaterLogsModel"));
  assign(
    "createUploadRequest",
    object({
      assetId: id,
      mediaAssetId: id,
      _id: id,
      status: { const: "pending", type: "string" },
      method: { const: "PUT", type: "string" },
      uploadUrl: string,
      expiresAt: date,
      expiresIn: count,
      requiredHeaders: dictionary(string),
      headers: dictionary(string),
    }),
  );
  list("getMyMedia", ref("MediaAsset"));
  assign("confirmMediaUpload getMediaAsset", ref("MediaAsset"));
  assign("deleteMediaAsset", object({ _id: id, status: { const: "deleted", type: "string" } }));
  list("getComments", entity("comments"));
  assign("createComment updateComment", entity("comments"));
  assign("deleteComment", object({ _id: id, status: { const: "deleted", type: "string" } }));
  assign("upsertReaction", entity("reactions"));
  assign(
    "deleteReaction deleteRating unsaveItem deleteViewHistoryItem",
    object({ removed: boolean }),
  );
  list(
    "getSavedItems",
    extend(model("savedItems"), {
      target: nullable({
        anyOf: [ref("RecipesContent"), ref("PostsContent"), ref("VideosContent")],
      }),
      unavailable: boolean,
    }),
  );
  assign("saveItem", entity("savedItems"));
  assign("upsertRating", entity("ratings"));
  assign(
    "getRatingSummary",
    object({
      targetType: string,
      targetId: id,
      count,
      average: number,
      distribution: object(Object.fromEntries([1, 2, 3, 4, 5].map((key) => [key, count]))),
      myRating: nullable(rating),
    }),
  );
  list("getViewHistory", ref("HistoryEntry"));
  assign("clearViewHistory", object({ removed: count }));
  assign("recordView updateVideoProgress", ref("RecordedView"));
  list("getRelatedVideos", ref("VideosContent"), { recipe: nullable(entity("recipes")) });
  assign(
    "getVideoTranscript",
    object({
      videoId: id,
      transcript: nullable(string),
      chapters: model("videos").properties.chapters,
      summary: nullable(string),
    }),
  );
  list("getAiConversations", entity("aiConversations"));
  assign("createAiConversation", entity("aiConversations"));
  list("getAiMessages", entity("aiMessages"));
  assign("sendAiMessage", ref("AiChatMessage"));
  assign("createMealPlanProposal", ref("MealPlanProposal"));
  assign("recognizeIngredients", ref("PantryProposal"));
  assign(
    "confirmMealPlanProposal",
    object({
      proposalId: id,
      status: { const: "confirmed", type: "string" },
      resource: entity("MealPlansModel"),
    }),
  );
  assign(
    "confirmPantryProposal",
    object({
      proposalId: id,
      status: { const: "confirmed", type: "string" },
      resource: entity("PantriesModel"),
    }),
  );
  assign("generateVideoSummary generateVideoSummaryFromVideoId", ref("VideoSummary"));
  assign("submitAiFeedback", entity("aiFeedback"));
  list("getNotifications", entity("notifications"));
  assign("getUnreadNotificationCount markAllNotificationsAsRead", object({ count }));
  assign("markNotificationAsRead", entity("notifications"));
  assign("deleteNotification", object({ deleted: boolean }));
  assign("getNotificationPreferences", {
    ...model("notificationPreferences"),
    required: (model("notificationPreferences").required ?? []).filter((key) => key !== "_id"),
  });
  assign("upsertNotificationPreferences", entity("notificationPreferences"));
  list("getReminders", entity("reminders"));
  assign("createReminder updateReminder", entity("reminders"));
  assign("deleteReminder", object({ cancelled: boolean }));
  list("getMyReports getAdminReports", entity("reports"));
  assign("createReport getMyReport updateAdminReport", entity("reports"));
  list("getModerationCases", entity("moderation"));
  assign("createModerationCase updateModerationCase", entity("moderation"));
  assign(
    "hideContent restoreContent",
    object({
      content: {
        anyOf: [entity("recipes"), entity("posts"), entity("videos"), entity("comments")],
      },
      moderationCase: entity("moderation"),
    }),
  );
  list("getAuditLogs", entity("auditLogs"));
  assign("getAiMetrics", ref("AiMetrics"));
  list("getAiRuns", ref("SafeAiRun"));
  assign("getAiRunDetail", ref("SafeAiRun"));
  list("getAiFeedback", ref("SafeAiFeedback"), { summary: dictionary(count) });
  const inventory = object({ publishedInRange: count, pending: count, hidden: count });
  assign(
    "getDashboardSummary",
    object({
      range,
      users: object({ total: count, active: count, suspended: count, newInRange: count }),
      content: object({ recipe: inventory, post: inventory, video: inventory }),
      reports: object({ open: count, reviewing: count, resolved: count, dismissed: count }),
      ai: ref("AiMetrics"),
      definitions: object({
        pendingAndHidden: string,
        activeAndSuspendedUsers: string,
        rangeCounts: string,
      }),
    }),
  );
  assign(
    "getContentTrends",
    object({
      range,
      interval: string,
      timezone: string,
      series: array(object({ type: string, published: array(bucket), flagged: array(bucket) })),
      definitions: object({ flagged: string, published: string }),
    }),
  );
  assign(
    "getUserTrends",
    object({
      range,
      interval: string,
      timezone: string,
      series: object({
        newUsers: array(bucket),
        activeUsers: array(bucket),
        suspendedUsers: array(bucket),
      }),
      definitions: object({ activeUsers: string, suspendedUsers: string }),
    }),
  );
  list("getPendingContent", {
    anyOf: ["recipes", "posts", "videos"].map((key) =>
      extend(project(model(key), summaryKeys), { type: string, status: string }, [
        "type",
        "status",
      ]),
    ),
  });

  const expected = new Set(apiManifest.map((route) => route.operationId));
  for (const key of Object.keys(responses))
    if (!expected.has(key)) throw new Error(`Extra response contract: ${key}`);
  const operations = apiManifest.map((route) => {
    if (
      !container.operations[route.operationId] ||
      !container.validation[route.operationId] ||
      !responses[route.operationId]
    )
      throw new Error(`Incomplete operation contract: ${route.operationId}`);
    const request = {};
    for (const [location, validator] of Object.entries(container.validation[route.operationId])) {
      const name = `${route.operationId}${location[0].toUpperCase()}${location.slice(1)}`;
      schemas[name] = convertValidator(validator);
      request[location] = name;
    }
    const responseName = `${route.operationId}Response`;
    const response = responses[route.operationId];
    schemas[responseName] = object({
      success: { const: true, type: "boolean" },
      data: response.data,
      meta: response.meta,
    });
    return {
      ...route,
      request,
      response: responseName,
      status: CREATED.has(route.operationId) ? 201 : 200,
      tests: ["tests/contract/api-contract.test.js", dedicatedTests[route.module]],
    };
  });
  assertConcreteSchemas(schemas);
  return { container, schemas, operations };
}

export function assertConcreteSchemas(schemas) {
  const visit = (value, location, schemaPosition = true) => {
    if (!value || typeof value !== "object") return;
    if (schemaPosition && !Array.isArray(value) && Object.keys(value).length === 0)
      throw new Error(`Unconstrained schema: ${location}`);
    if (value.$ref?.startsWith("#/components/schemas/") && !schemas[value.$ref.split("/").at(-1)])
      throw new Error(`Unresolved schema: ${value.$ref}`);
    for (const key of ["anyOf", "oneOf", "allOf"])
      for (const [index, item] of (value[key] ?? []).entries())
        visit(item, `${location}.${key}.${index}`);
    for (const [key, item] of Object.entries(value.properties ?? {}))
      visit(item, `${location}.${key}`);
    if (value.items) visit(value.items, `${location}.items`);
    if (typeof value.additionalProperties === "object")
      visit(value.additionalProperties, `${location}.additionalProperties`);
  };
  for (const [name, schema] of Object.entries(schemas)) visit(schema, name);
}
