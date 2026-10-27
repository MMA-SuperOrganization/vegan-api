import { fitsDiet } from "../../common/utils/diet.js";
import { AppError } from "../../common/errors/app-error.js";
import { scaleNutrition, sumNutrition } from "../../common/utils/nutrition.js";
import { AI_DISCLAIMER } from "../../providers/ai/ai.provider.js";
import { chatOutput, mealPlanOutput, pantryOutput, summaryOutput } from "./ai.validation.js";
import { linkAiCatalogReferences } from "./ai.references.js";
const own = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  if (actor.status && actor.status !== "active") throw AppError.forbidden("Account is not active");
  return actor.userId;
};
const invalidOutput = () =>
  new AppError({
    statusCode: 502,
    code: "AI_INVALID_OUTPUT",
    message: "AI returned an invalid structured response",
  });
const safeProfile = (profile) =>
  Object.fromEntries(
    [
      "dietType",
      "allergies",
      "allergenIds",
      "dietaryRestrictions",
      "goal",
      "dailyCalorieTarget",
      "proteinTargetG",
      "carbTargetG",
      "fatTargetG",
      "fiberTargetG",
      "preferredFoodItemIds",
      "dislikedFoodItemIds",
      "excludedFoodItemIds",
    ]
      .filter((k) => profile?.[k] !== undefined)
      .map((k) => [k, profile[k]]),
  );
const resultData = (result) => result?.data ?? result;
const dateString = (value) => new Date(value).toISOString().slice(0, 10);
const TARGET_NUTRIENTS = Object.freeze({
  dailyCalorieTarget: "caloriesKcal",
  proteinTargetG: "proteinG",
  carbTargetG: "carbsG",
  fatTargetG: "fatG",
  fiberTargetG: "fiberG",
});
const TARGET_TOLERANCE = 0.2;

export function createAiService({
  aiRepository: repos,
  repositories = {},
  services = {},
  env = {},
  aiProvider,
  clock = () => new Date(),
  transaction,
  logger,
} = {}) {
  const now = () => new Date(clock());
  const enabled = () => {
    if (env.ai?.enabled !== true || aiProvider?.enabled === false)
      throw AppError.serviceUnavailable("AI features are disabled", "AI_DISABLED");
    if (!aiProvider?.generate)
      throw AppError.serviceUnavailable("AI provider is unavailable", "AI_UNAVAILABLE");
  };
  const conversation = async (userId, id) => {
    const value = await repos.aiConversations.findOne({ _id: id, userId });
    if (!value) throw AppError.notFound("Conversation not found");
    return value;
  };
  async function execute(
    userId,
    feature,
    schema,
    messages,
    { requestId, mediaUrl, inputMetadata = {}, validate } = {},
  ) {
    enabled();
    const started = now();
    const run = await repos.aiRuns.create({
      userId,
      feature,
      provider: aiProvider.provider || env.ai.provider,
      model: feature === "ingredient_recognition" ? env.ai.visionModel : env.ai.chatModel,
      status: "pending",
      inputMetadata,
    });
    try {
      const output = await aiProvider.generate({ feature, schema, messages, mediaUrl, requestId });
      const parsed = schema.safeParse(resultData(output));
      if (!parsed.success) throw invalidOutput();
      if (validate) await validate(parsed.data);
      await repos.aiRuns.updateOne(
        { _id: run._id, userId },
        {
          $set: {
            status: "completed",
            model: output.model || env.ai.chatModel,
            latencyMs: Math.max(0, now() - started),
            tokenUsage: output.usage || {},
            outputMetadata: { validated: true },
          },
        },
      );
      return {
        data: parsed.data,
        runId: run._id,
        model: output.model || env.ai.chatModel,
        usage: output.usage || {},
      };
    } catch (error) {
      await repos.aiRuns.updateOne(
        { _id: run._id, userId },
        {
          $set: {
            status: "failed",
            latencyMs: Math.max(0, now() - started),
            errorCode: error instanceof AppError ? error.code : "AI_PROVIDER_ERROR",
          },
        },
      );
      logger?.warn?.({ feature, code: error.code || "AI_PROVIDER_ERROR" }, "AI request failed");
      if (error instanceof AppError) throw error;
      throw new AppError({
        statusCode: 502,
        code: "AI_PROVIDER_ERROR",
        message: "AI provider could not complete this request",
      });
    }
  }
  async function context(userId) {
    const [profile, nutrition] = await Promise.all([
      services.users?.getProfile?.(userId),
      services.users?.getNutrition?.(userId),
    ]);
    return { profile: safeProfile(profile), nutrition: safeProfile(nutrition) };
  }
  async function nutritionTargets(userId, session) {
    const [profile, nutrition] = await Promise.all([
      services.users?.getProfile?.(userId, { session }),
      services.users?.getNutrition?.(userId, { session }),
    ]);
    return { ...safeProfile(profile), ...safeProfile(nutrition) };
  }
  async function dietarySafety(userId, session) {
    // Sequential reads when confirming inside a Mongo session.
    const profile = await services.users?.getProfile?.(userId, { session });
    const nutrition = await services.users?.getNutrition?.(userId, { session });
    return {
      dietType: profile?.dietType ?? "vegan",
      excludedFoodItemIds: new Set((profile?.excludedFoodItemIds ?? []).map(String)),
      allergenIds: new Set(
        [...(profile?.allergenIds || []), ...(nutrition?.allergenIds || [])].map(String),
      ),
    };
  }
  async function verifyFood(foodItemId, safety, session) {
    if (!services.foodItems?.getById)
      throw AppError.serviceUnavailable("Food item service is unavailable");
    const food = await services.foodItems.getById(foodItemId, { session });
    if (
      !food ||
      food.status !== "active" ||
      !fitsDiet(food, safety.dietType) ||
      food.deletedAt ||
      safety.excludedFoodItemIds.has(String(foodItemId)) ||
      (food.allergenIds || []).some((id) => safety.allergenIds.has(String(id)))
    )
      throw invalidOutput();
    return food;
  }
  async function verifyPantry(data, userId, session, { resolveNames = false } = {}) {
    const safety = await dietarySafety(userId, session);
    for (const item of data.items.filter((value) => value.foodItemId)) {
      const food = await verifyFood(item.foodItemId, safety, session);
      if (resolveNames && food.name) item.name = food.name;
    }
  }
  async function verifyRecipes(data, userId, session, { enforceTargets = false } = {}) {
    const safety = await dietarySafety(userId, session);
    const recipes = new Map();
    for (const id of new Set(data.days.flatMap((day) => day.meals.map((m) => m.recipeId)))) {
      if (!services.recipes?.getById)
        throw AppError.serviceUnavailable("Recipe service is unavailable");
      const recipe = await services.recipes.getById(id, {
        actor: { userId },
        publicOnly: true,
        session,
      });
      if (
        !recipe ||
        recipe.status !== "published" ||
        recipe.visibility !== "public" ||
        recipe.deletedAt ||
        !recipe.ingredients?.length ||
        (recipe.allergenIds || []).some((value) => safety.allergenIds.has(String(value)))
      )
        throw invalidOutput();
      // Check authoritative foods, not provider claims or potentially stale recipe snapshots.
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.foodItemId) throw invalidOutput();
        await verifyFood(ingredient.foodItemId, safety, session);
      }
      recipes.set(String(id), recipe);
    }
    if (!enforceTargets) return;
    const targets = await nutritionTargets(userId, session);
    const configuredTargets = Object.entries(TARGET_NUTRIENTS).filter(
      ([target]) => Number.isFinite(targets[target]) && targets[target] > 0,
    );
    if (!configuredTargets.length) return;
    for (const day of data.days) {
      let total;
      try {
        total = sumNutrition(
          day.meals.map((meal) => {
            const recipe = recipes.get(String(meal.recipeId));
            if (!recipe?.nutritionPerServing) throw invalidOutput();
            return scaleNutrition(recipe.nutritionPerServing, meal.servings);
          }),
        );
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw invalidOutput();
      }
      for (const [target, nutrient] of configuredTargets) {
        const minimum = targets[target] * (1 - TARGET_TOLERANCE);
        const maximum = nutrient === "fiberG" ? Number.POSITIVE_INFINITY : targets[target] * 1.2;
        if (total[nutrient] < minimum || total[nutrient] > maximum) throw invalidOutput();
      }
    }
  }
  async function groundingCatalog(userId) {
    const safety = await dietarySafety(userId);
    const [foods, recipes] = await Promise.all([
      repositories.foodItems?.findMany?.(
        { status: "active" },
        {
          page: 1,
          limit: 40,
          projection: { _id: 1, name: 1, allergenIds: 1, isVegan: 1, isVegetarian: 1 },
        },
      ) ?? { data: [] },
      repositories.recipes?.findMany?.(
        { status: "published", visibility: "public" },
        {
          page: 1,
          limit: 30,
          projection: { _id: 1, title: 1, allergenIds: 1, ingredients: 1 },
        },
      ) ?? { data: [] },
    ]);
    const safeFoods = (foods.data ?? []).filter(
      (food) =>
        fitsDiet(food, safety.dietType) &&
        !safety.excludedFoodItemIds.has(String(food._id)) &&
        !(food.allergenIds ?? []).some((id) => safety.allergenIds.has(String(id))),
    );
    const safeFoodIds = new Set(safeFoods.map((food) => String(food._id)));
    const safeRecipes = (recipes.data ?? []).filter(
      (recipe) =>
        !(recipe.allergenIds ?? []).some((id) => safety.allergenIds.has(String(id))) &&
        (recipe.ingredients ?? []).every((ingredient) =>
          safeFoodIds.has(String(ingredient.foodItemId)),
        ),
    );
    return {
      instruction:
        "Prefer these authoritative catalog records. Do not invent IDs or recommend ingredients outside the supplied safe catalog. When mentioning a supplied recipe, render its title exactly as [Recipe title](veganapp://recipe/ID). When mentioning a supplied food, render its name exactly as [Food name](veganapp://food/ID). Never display an ID as visible text, code, parentheses, or an ID label.",
      foods: safeFoods.map(({ _id, name }) => ({ id: _id, name })),
      recipes: safeRecipes.map(({ _id, title }) => ({ id: _id, title })),
    };
  }
  async function readyMedia(userId, id, type) {
    if (!services.media?.getOwnedReady)
      throw AppError.serviceUnavailable("Media service is unavailable");
    const media = await services.media.getOwnedReady(userId, id, { type });
    if (
      !media ||
      String(media.userId ?? media.ownerId) !== String(userId) ||
      media.status !== "ready" ||
      (media.kind && media.kind !== type)
    )
      throw AppError.notFound("Ready media not found");
    return media;
  }
  async function storeProposal(userId, type, output, extra = {}) {
    const proposal = await repos.aiProposals.create({
      userId,
      type,
      aiRunId: output.runId,
      status: "pending",
      structuredData: output.data,
      expiresAt: new Date(now().getTime() + 60 * 60 * 1000),
      ...extra,
    });
    return {
      proposalId: proposal._id,
      runId: output.runId,
      status: "pending",
      expiresAt: proposal.expiresAt,
      ...output.data,
      disclaimer: AI_DISCLAIMER,
    };
  }
  async function confirm({ actor, params, body = {} }, type) {
    enabled();
    const userId = own(actor);
    const existing = await repos.aiProposals.findOne({ _id: params.proposalId, userId, type });
    if (!existing) throw AppError.notFound("Proposal not found");
    if (existing.status === "confirmed") return existing.result;
    if (new Date(existing.expiresAt) <= now())
      throw AppError.conflict("Proposal has expired", [], "AI_PROPOSAL_EXPIRED");
    if (!transaction)
      throw AppError.serviceUnavailable(
        "Proposal confirmation requires transactions",
        "TRANSACTIONS_REQUIRED",
      );
    return transaction(async (session) => {
      const current = await repos.aiProposals.findOne(
        { _id: params.proposalId, userId, type },
        { session },
      );
      if (!current) throw AppError.notFound("Proposal not found");
      if (current.status === "confirmed") return current.result;
      const claimed = await repos.aiProposals.updateOne(
        { _id: current._id, userId, type, status: "pending", expiresAt: { $gt: now() } },
        { $set: { status: "confirmed", confirmedAt: now() } },
        { session },
      );
      if (!claimed)
        throw AppError.conflict(
          "Proposal is expired or already consumed",
          [],
          "AI_PROPOSAL_UNAVAILABLE",
        );
      let resource;
      let confirmedData;
      if (type === "meal_plan") {
        const parsed = mealPlanOutput.safeParse({
          ...current.structuredData,
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.days !== undefined ? { days: body.days } : {}),
        });
        if (!parsed.success) throw invalidOutput();
        const originalDates = (current.structuredData.days ?? []).map((day) => day.date).sort();
        const selectedDates = parsed.data.days.map((day) => day.date).sort();
        if (JSON.stringify(originalDates) !== JSON.stringify(selectedDates))
          throw AppError.badRequest("Selected meals must keep the proposal dates");
        await verifyRecipes(parsed.data, userId, session, {
          enforceTargets: current.usesProfile === true,
        });
        confirmedData = parsed.data;
        if (!services.mealPlans?.createForUser)
          throw AppError.serviceUnavailable("Meal plan service is unavailable");
        resource = await services.mealPlans.createForUser(
          userId,
          {
            title: parsed.data.title,
            weekStartDate: current.startDate,
            days: parsed.data.days.map((d) => ({
              date: d.date,
              meals: d.meals.map(({ slot, ...meal }) => ({ ...meal, type: slot })),
            })),
          },
          { session },
        );
        if (body.activate) {
          if (!services.mealPlans.activate)
            throw AppError.serviceUnavailable("Meal plan activation is unavailable");
          resource = await services.mealPlans.activate(userId, resource._id ?? resource.id, {
            session,
          });
        }
      } else {
        const parsed = pantryOutput.safeParse({
          ...current.structuredData,
          ...(body.items !== undefined
            ? {
                items: body.items.map((item) => ({ ...item, name: item.foodItemId })),
              }
            : {}),
        });
        if (!parsed.success) throw invalidOutput();
        if (parsed.data.items.some((item) => !item.foodItemId))
          throw AppError.conflict(
            "Resolve recognized ingredients to food items before confirmation",
            [],
            "AI_UNRESOLVED_INGREDIENTS",
          );
        await verifyPantry(parsed.data, userId, session, { resolveNames: true });
        confirmedData = parsed.data;
        if (!services.pantries?.addItems)
          throw AppError.serviceUnavailable("Pantry service is unavailable");
        resource = await services.pantries.addItems(
          userId,
          parsed.data.items.map((i) => ({
            foodItemId: i.foodItemId,
            quantity: i.quantity,
            unit: i.unit,
            ...(i.expiryDate ? { expiresAt: `${i.expiryDate}T00:00:00.000Z` } : {}),
          })),
          { session },
        );
      }
      const result = { proposalId: current._id, status: "confirmed", resource };
      if (
        !(await repos.aiProposals.updateOne(
          { _id: current._id, userId, status: "confirmed" },
          { $set: { result, structuredData: confirmedData } },
          { session },
        ))
      )
        throw AppError.conflict("Proposal confirmation failed");
      return result;
    });
  }
  const service = {
    async getAiConversations({ actor, query = {} }) {
      return repos.aiConversations.findMany(
        { userId: own(actor) },
        { ...query, sort: { lastMessageAt: -1, _id: -1 } },
      );
    },
    async createAiConversation({ actor, body }) {
      enabled();
      return repos.aiConversations.create({
        userId: own(actor),
        title: body.title,
        status: "active",
      });
    },
    async getAiMessages({ actor, params, query = {} }) {
      const userId = own(actor);
      await conversation(userId, params.id);
      return repos.aiMessages.findMany(
        { userId, conversationId: params.id },
        { ...query, sort: { createdAt: 1, _id: 1 } },
      );
    },
    async sendAiMessage({ actor, params, body, requestId }) {
      enabled();
      const userId = own(actor);
      const convo = await conversation(userId, params.id);
      if (convo.status !== "active") throw AppError.conflict("Conversation is archived");
      const content = String(body.content).slice(0, 4000);
      const history = await repos.aiMessages.findMany(
        { userId, conversationId: params.id, status: "completed" },
        { page: 1, limit: 12, sort: { createdAt: -1, _id: -1 } },
      );
      let output;
      if (
        /chest pain|can'?t breathe|suicid|overdos|diagnos|prescrib|treat my|stop .*medication|đau ngực|khó thở|tự tử|chẩn đoán/i.test(
          content,
        )
      ) {
        const run = await repos.aiRuns.create({
          userId,
          feature: "chat",
          status: "blocked",
          provider: "safety-policy",
          inputMetadata: { safetyPolicy: true },
        });
        output = {
          runId: run._id,
          data: {
            content:
              "I cannot diagnose or prescribe treatment. Please contact a qualified healthcare professional. If symptoms are urgent or you may harm yourself, contact local emergency services now.",
          },
          model: "safety-policy",
          usage: {},
        };
      } else {
        const catalog = await groundingCatalog(userId);
        output = await execute(
          userId,
          "chat",
          chatOutput,
          [
            {
              role: "user",
              content: JSON.stringify({
                ...(body.useProfile === true ? { userContext: await context(userId) } : {}),
                catalog,
              }),
            },
            ...history.data.reverse().map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
          {
            requestId,
            inputMetadata: { conversationId: String(params.id), messageLength: content.length },
          },
        );
        output.data.content = linkAiCatalogReferences(output.data.content, catalog);
      }
      // Do not persist a user turn until generation succeeds. Otherwise a
      // provider failure followed by retry leaves duplicate orphaned prompts.
      await repos.aiMessages.create({
        userId,
        conversationId: params.id,
        role: "user",
        content,
        status: "completed",
      });
      const message = await repos.aiMessages.create({
        userId,
        conversationId: params.id,
        aiRunId: output.runId,
        role: "assistant",
        content: `${output.data.content}\n\n${AI_DISCLAIMER}`,
        model: output.model,
        usage: output.usage,
        status: output.model === "safety-policy" ? "blocked" : "completed",
      });
      await repos.aiConversations.updateOne(
        { _id: params.id, userId },
        { $set: { lastMessageAt: now() } },
      );
      return { ...message, runId: output.runId, disclaimer: AI_DISCLAIMER };
    },
    async createMealPlanProposal({ actor, body, requestId }) {
      enabled();
      const userId = own(actor);
      const catalog = repositories.recipes
        ? await repositories.recipes.findMany(
            { status: "published", visibility: "public" },
            { page: 1, limit: 40, projection: { _id: 1, title: 1, ingredients: 1 } },
          )
        : { data: [] };
      const output = await execute(
        userId,
        "meal_plan",
        mealPlanOutput,
        [
          {
            role: "user",
            content: JSON.stringify({
              request: body,
              context: body.useProfile === true ? await context(userId) : {},
              recipes: catalog.data,
            }),
          },
        ],
        {
          requestId,
          inputMetadata: { days: body.days },
          validate: async (data) => {
            const expected = Array.from({ length: body.days }, (_, i) =>
              dateString(Date.parse(`${body.startDate}T00:00:00Z`) + i * 86400000),
            );
            if (
              data.days.length !== body.days ||
              new Set(data.days.map((d) => d.date)).size !== body.days ||
              data.days.some((d) => !expected.includes(d.date))
            )
              throw invalidOutput();
            await verifyRecipes(data, userId, undefined, {
              enforceTargets: body.useProfile === true,
            });
          },
        },
      );
      return storeProposal(userId, "meal_plan", output, {
        startDate: body.startDate,
        usesProfile: body.useProfile === true,
      });
    },
    confirmMealPlanProposal: (input) => confirm(input, "meal_plan"),
    async recognizeIngredients({ actor, body, requestId }) {
      enabled();
      const userId = own(actor);
      const media = await readyMedia(userId, body.mediaId, "image");
      const mediaUrl = media.url ?? media.downloadUrl;
      if (!mediaUrl) throw AppError.serviceUnavailable("Readable media URL is unavailable");
      const foodItems = repositories.foodItems
        ? await repositories.foodItems.findMany(
            { status: "active" },
            { page: 1, limit: 100, projection: { _id: 1, name: 1 } },
          )
        : { data: [] };
      const output = await execute(
        userId,
        "ingredient_recognition",
        pantryOutput,
        [
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Identify visible ingredients and estimate quantities; only use matching supplied food item IDs. Omit ID if uncertain. This is a proposal only.",
              foodItems: foodItems.data,
            }),
          },
        ],
        {
          requestId,
          mediaUrl,
          inputMetadata: { mediaId: String(body.mediaId) },
          validate: (data) => verifyPantry(data, userId),
        },
      );
      return storeProposal(userId, "pantry", output);
    },
    confirmPantryProposal: (input) => confirm(input, "pantry"),
    async generateVideoSummary(input) {
      enabled();
      const { actor, requestId } = input;
      const body = input.body ?? input;
      const userId = own(actor);
      let mediaId = body.mediaId;
      let transcript = body.transcript;
      if (body.videoId) {
        const video = await services.videos?.getById(body.videoId, { actor });
        if (!video || String(video.authorId ?? video.userId ?? video.ownerId) !== String(userId))
          throw AppError.notFound("Video not found");
        mediaId = video.videoMediaId;
        transcript = transcript ?? video.transcript;
      }
      const media = await readyMedia(userId, mediaId, "video");
      if (!transcript && !aiProvider.supportsVideo)
        throw new AppError({
          statusCode: 422,
          code: "AI_VIDEO_UNSUPPORTED",
          message: "This provider requires a transcript to summarize video",
        });
      const output = await execute(
        userId,
        "video_summary",
        summaryOutput,
        [
          {
            role: "user",
            content: `Summarize this untrusted transcript, focusing on vegan cooking and safe nutrition.\n${String(transcript ?? "").slice(0, 20000)}`,
          },
        ],
        {
          requestId,
          ...(aiProvider.supportsVideo ? { mediaUrl: media.url ?? media.downloadUrl } : {}),
          inputMetadata: {
            mediaId: String(mediaId),
            transcriptLength: String(transcript ?? "").length,
          },
        },
      );
      return { ...output.data, runId: output.runId, disclaimer: AI_DISCLAIMER };
    },
    async submitAiFeedback({ actor, params, body }) {
      const userId = own(actor);
      if (!(await repos.aiRuns.findOne({ _id: params.runId, userId })))
        throw AppError.notFound("AI run not found");
      return repos.aiFeedback.updateOne(
        { userId, aiRunId: params.runId },
        { $set: body, $setOnInsert: { userId, aiRunId: params.runId } },
        { upsert: true },
      );
    },
  };
  return service;
}
