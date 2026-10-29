import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { chatRetrievalOutput, createAiModule } from "../../src/modules/ai/index.js";
import { createAiProvider, AI_SAFETY_PROMPT } from "../../src/providers/ai/ai.provider.js";
import { linkAiCatalogReferences } from "../../src/modules/ai/ai.references.js";
import { fakeRepository, fakeTransaction, objectId } from "./ai-reminders-fakes.js";
const userId = objectId(),
  other = objectId(),
  recipeId = objectId(),
  foodId = objectId(),
  mediaId = objectId();
const actor = { userId };
const at = new Date("2026-10-03T12:00:00Z");
function fixture(overrides = {}) {
  const clock = () => at;
  const repositories = Object.fromEntries(
    [
      "aiConversations",
      "aiMessages",
      "aiRuns",
      "aiFeedback",
      "aiProposals",
      "mealPlans",
      "pantries",
      "recipes",
      "foodItems",
    ].map((key) => [key, fakeRepository([], clock)]),
  );
  const outputs = {
    chat: { content: "Try tofu, beans and vegetables." },
    meal_plan: {
      title: "Balanced vegan day",
      days: [{ date: "2026-10-05", meals: [{ slot: "lunch", recipeId, servings: 1 }] }],
    },
    ingredient_recognition: {
      items: [{ foodItemId: foodId, name: "Tofu", quantity: 250, unit: "g" }],
    },
    video_summary: {
      summary: "Prepare a balanced vegan bowl.",
      keyPoints: ["Use beans and whole grains."],
    },
  };
  const aiProvider = {
    enabled: true,
    provider: "fake",
    generate: vi.fn(async ({ feature }) => ({
      data: outputs[feature],
      model: `fake-${feature}`,
      usage: { total_tokens: 10 },
    })),
  };
  const services = {
    users: {
      getProfile: vi.fn(async () => ({ dietType: "vegan", email: "SECRET_EMAIL" })),
      getNutrition: vi.fn(async () => ({
        dailyCalorieTarget: 2000,
        medicalNotes: "SECRET_MEDICAL",
      })),
    },
    recipes: {
      getById: vi.fn(async () => ({
        _id: recipeId,
        status: "published",
        visibility: "public",
        isVegan: true,
        ingredients: [{ foodItemId: foodId }],
        allergenIds: [],
      })),
    },
    foodItems: { getById: vi.fn(async () => ({ _id: foodId, status: "active", isVegan: true })) },
    media: {
      getOwnedReady: vi.fn(async (uid, id, { type }) => ({
        _id: id,
        ownerId: uid,
        status: "ready",
        kind: type,
        url: "https://private.example.test/signed",
      })),
    },
    mealPlans: {
      createForUser: vi.fn(async (uid, body) =>
        repositories.mealPlans.create({ userId: uid, ...body }),
      ),
      activate: vi.fn(async (uid, id) =>
        repositories.mealPlans.updateOne({ _id: id, userId: uid }, { $set: { status: "active" } }),
      ),
    },
    pantries: {
      addItems: vi.fn(async (uid, items) => repositories.pantries.create({ userId: uid, items })),
    },
  };
  const deps = {
    repositories,
    services,
    aiProvider,
    clock,
    transaction: fakeTransaction(repositories),
    env: { ai: { enabled: true, chatModel: "fake-chat", visionModel: "fake-vision" } },
  };
  Object.assign(deps, overrides);
  return { ...createAiModule(deps), deps, outputs, provider: aiProvider, repos: repositories };
}
describe("AI complete domain", () => {
  it("turns catalog IDs into tappable app links without exposing ID labels", () => {
    const content = [
      `- **Avocado Chickpea Salad** (ID: \`${recipeId}\`) - Rich in healthy fats`,
      `- Tofu (ID: ${foodId})`,
    ].join("\n");
    const linked = linkAiCatalogReferences(content, {
      recipes: [{ id: recipeId, title: "Avocado Chickpea Salad" }],
      foods: [{ id: foodId, name: "Tofu" }],
    });

    expect(linked).toContain(
      `**[Avocado Chickpea Salad](veganapp://recipe/${recipeId})** - Rich in healthy fats`,
    );
    expect(linked).toContain(`[Tofu](veganapp://food/${foodId})`);
    expect(linked).not.toMatch(/\bID\s*:/i);
  });
  it("confirms selected pantry items, resolving unknown recognition without another provider call", async () => {
    const f = fixture();
    f.outputs.ingredient_recognition = {
      items: [{ name: "Unknown bean", quantity: 1, unit: "piece" }],
    };
    const proposal = await f.operations.recognizeIngredients({ actor, body: { mediaId } });
    expect(f.repos.pantries.records).toHaveLength(0);
    const input = {
      actor,
      params: { proposalId: proposal.proposalId },
      body: { items: [{ foodItemId: foodId, quantity: 200, unit: "g", expiryDate: "2026-10-10" }] },
    };
    const result = await f.operations.confirmPantryProposal(input);
    expect(result.resource.items).toEqual([
      { foodItemId: foodId, quantity: 200, unit: "g", expiresAt: "2026-10-10T00:00:00.000Z" },
    ]);
    expect(
      await f.operations.confirmPantryProposal({
        ...input,
        body: { items: [{ foodItemId: foodId, quantity: 999, unit: "g" }] },
      }),
    ).toEqual(result);
    expect(f.repos.pantries.records).toHaveLength(1);
    expect(f.provider.generate).toHaveBeenCalledTimes(1);
  });
  it("confirms edited meals but rejects changed dates, foreign proposals and unsafe food atomically", async () => {
    const f = fixture();
    const proposal = await f.operations.createMealPlanProposal({
      actor,
      body: { startDate: "2026-10-05", days: 1 },
    });
    const input = {
      actor,
      params: { proposalId: proposal.proposalId },
      body: {
        title: "My chosen meals",
        days: [{ date: "2026-10-05", meals: [{ slot: "dinner", recipeId, servings: 2 }] }],
      },
    };
    await expect(
      f.operations.confirmMealPlanProposal({
        ...input,
        body: { days: [{ ...input.body.days[0], date: "2026-10-06" }] },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      f.operations.confirmMealPlanProposal({ ...input, actor: { userId: other } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    f.deps.services.foodItems.getById.mockResolvedValueOnce({
      _id: foodId,
      status: "active",
      isVegan: false,
    });
    await expect(f.operations.confirmMealPlanProposal(input)).rejects.toMatchObject({
      code: "AI_INVALID_OUTPUT",
    });
    expect(f.repos.aiProposals.records[0].status).toBe("pending");
    expect(f.repos.mealPlans.records).toHaveLength(0);
    const result = await f.operations.confirmMealPlanProposal(input);
    expect(result.resource).toMatchObject({
      title: "My chosen meals",
      days: [{ date: "2026-10-05", meals: [{ type: "dinner", servings: 2 }] }],
    });
    expect(f.deps.services.mealPlans.activate).not.toHaveBeenCalled();
    expect(f.provider.generate).toHaveBeenCalledTimes(1);
  });
  it("rejects privileged fields and empty selections in confirmation payloads", () => {
    const f = fixture();
    for (const payload of [
      { items: [] },
      { items: [{ foodItemId: foodId, quantity: 2, unit: "g", userId: other }] },
      { role: "admin" },
    ]) {
      expect(f.validation.confirmPantryProposal.body.safeParse(payload).success).toBe(false);
    }
    expect(
      f.validation.confirmMealPlanProposal.body.safeParse({ days: [], activate: true }).success,
    ).toBe(false);
  });
  it("exports exact operations and strict schemas", () => {
    const f = fixture();
    expect(Object.keys(f.operations).sort()).toEqual(Object.keys(f.validation).sort());
    expect(
      f.validation.sendAiMessage.body.safeParse({ content: "hi", userId: other }).success,
    ).toBe(false);
    expect(
      f.validation.createMealPlanProposal.body.safeParse({ startDate: "2026-02-30" }).success,
    ).toBe(false);
  });
  it("disabled returns 503 without persistence/provider call", async () => {
    const f = fixture({ env: { ai: { enabled: false } } });
    await expect(
      f.operations.createAiConversation({ actor, body: { title: "x" } }),
    ).rejects.toMatchObject({ statusCode: 503, code: "AI_DISABLED" });
    expect(f.provider.generate).not.toHaveBeenCalled();
    expect(f.repos.aiConversations.records).toHaveLength(0);
  });
  it("keeps owned AI history and feedback available while generation is disabled", async () => {
    const f = fixture();
    const conversation = await f.repos.aiConversations.create({
      userId,
      title: "Saved history",
      status: "active",
    });
    await f.repos.aiMessages.create({
      userId,
      conversationId: conversation._id,
      role: "assistant",
      content: "Saved answer",
      status: "completed",
    });
    const run = await f.repos.aiRuns.create({ userId, feature: "chat", status: "completed" });
    f.deps.env.ai.enabled = false;
    expect((await f.operations.getAiConversations({ actor })).data).toHaveLength(1);
    expect(
      (await f.operations.getAiMessages({ actor, params: { id: conversation._id } })).data,
    ).toHaveLength(1);
    await expect(
      f.operations.submitAiFeedback({
        actor,
        params: { runId: run._id },
        body: { rating: "helpful" },
      }),
    ).resolves.toMatchObject({ rating: "helpful" });
  });
  it("returns conversation messages in a deterministic chronological order", async () => {
    const f = fixture();
    const conversation = await f.repos.aiConversations.create({
      userId,
      title: "Ordered history",
      status: "active",
    });
    const later = await f.repos.aiMessages.create({
      _id: "ffffffffffffffffffffffff",
      userId,
      conversationId: conversation._id,
      role: "assistant",
      content: "Second",
      status: "completed",
    });
    const earlier = await f.repos.aiMessages.create({
      _id: "000000000000000000000000",
      userId,
      conversationId: conversation._id,
      role: "user",
      content: "First",
      status: "completed",
    });

    const result = await f.operations.getAiMessages({
      actor,
      params: { id: conversation._id },
    });

    expect(result.data.map((message) => message._id)).toEqual([earlier._id, later._id]);
  });
  it("persists owned chat, bounded context and privacy-safe run metadata", async () => {
    const f = fixture();
    const c = await f.operations.createAiConversation({ actor, body: { title: "Cooking" } });
    const result = await f.operations.sendAiMessage({
      actor,
      params: { id: c._id },
      body: { content: "What can I cook?" },
      requestId: "request-1",
    });
    expect(result.content).toContain("not medical advice");
    expect(f.repos.aiMessages.records).toHaveLength(2);
    expect(f.repos.aiRuns.records[0]).toMatchObject({ feature: "chat", status: "completed" });
    const prompt = JSON.stringify(f.provider.generate.mock.calls[0][0]);
    expect(prompt).not.toContain("SECRET_");
    expect(prompt).toContain("veganapp://recipe/ID");
    expect(prompt).toContain("Never display an ID as visible text");
    await expect(
      f.operations.getAiMessages({ actor: { userId: other }, params: { id: c._id } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect((await f.operations.getAiConversations({ actor: { userId: other } })).data).toHaveLength(
      0,
    );
  });
  it("uses an AI retrieval plan, filters DB candidates and returns tappable verified recipes", async () => {
    const f = fixture();
    f.provider.planRetrieval = vi.fn(async () => ({
      data: {
        mode: "catalog",
        searchText: "",
        recipeTerms: [],
        foodTerms: [],
        filters: { maxCaloriesKcal: 500, minProteinG: 15 },
      },
    }));
    await f.repos.foodItems.create({
      _id: foodId,
      name: "Tofu",
      status: "active",
      isVegan: true,
      isVegetarian: true,
      allergenIds: [],
      nutritionDataQuality: "verified",
      nutritionPer100g: { caloriesKcal: 76, proteinG: 8.1 },
    });
    await f.repos.recipes.create({
      _id: recipeId,
      title: "Protein Tofu Bowl",
      status: "published",
      visibility: "public",
      isVegan: true,
      isVegetarian: true,
      allergenIds: [],
      nutritionDataQuality: "verified",
      nutritionPerServing: { caloriesKcal: 420, proteinG: 24 },
      ingredients: [{ foodItemId: foodId, foodNameSnapshot: "Tofu", quantity: 200, unit: "g" }],
    });
    f.outputs.chat = {
      content: `Try **Protein Tofu Bowl** (ID: \`${recipeId}\`) for dinner.`,
    };
    const conversation = await f.operations.createAiConversation({
      actor,
      body: { title: "Protein dinner" },
    });

    const answer = await f.operations.sendAiMessage({
      actor,
      params: { id: conversation._id },
      body: { content: "Suggest a high-protein dinner under 500 kcal" },
      requestId: "retrieval-request",
    });

    expect(f.provider.planRetrieval).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.stringContaining("high-protein"),
        requestId: "retrieval-request",
      }),
    );
    expect(answer.content).toContain(`[Protein Tofu Bowl](veganapp://recipe/${recipeId})`);
    expect(f.repos.aiRuns.records[0].inputMetadata).toMatchObject({
      retrievalMode: "catalog",
      recipeCount: 1,
      foodCount: 1,
    });
  });
  it("uses lower-quality catalog evidence only when no verified record is available", async () => {
    const f = fixture();
    f.provider.planRetrieval = vi.fn(async () => ({
      data: {
        mode: "catalog",
        searchText: "",
        recipeTerms: [],
        foodTerms: [],
        filters: {},
      },
    }));
    const qualities = ["unavailable", "estimated", "verified"];
    for (const [index, quality] of qualities.entries()) {
      const catalogFoodId = objectId();
      await f.repos.foodItems.create({
        _id: catalogFoodId,
        name: `${quality} food`,
        status: "active",
        isVegan: true,
        allergenIds: [],
        nutritionDataQuality: quality,
      });
      await f.repos.recipes.create({
        _id: objectId(),
        title: `${quality} recipe`,
        status: "published",
        visibility: "public",
        isVegan: true,
        allergenIds: [],
        nutritionDataQuality: quality,
        ingredients: [{ foodItemId: catalogFoodId, foodNameSnapshot: `${quality} food` }],
        createdOrder: index,
      });
    }
    const conversation = await f.operations.createAiConversation({
      actor,
      body: { title: "Evidence quality" },
    });

    await f.operations.sendAiMessage({
      actor,
      params: { id: conversation._id },
      body: { content: "Suggest a vegan recipe" },
    });

    const prompt = JSON.stringify(f.provider.generate.mock.calls[0][0]);
    expect(prompt).toContain("verified food");
    expect(prompt).toContain("verified recipe");
    expect(prompt).not.toContain("estimated food");
    expect(prompt).not.toContain("estimated recipe");
    expect(prompt).not.toContain("unavailable food");
    expect(prompt).not.toContain("unavailable recipe");
    expect(prompt).toContain("use unavailable records only when no suitable higher-quality record");

    for (const repository of [f.repos.foodItems, f.repos.recipes]) {
      const remaining = repository.records.filter(
        (record) => record.nutritionDataQuality !== "verified",
      );
      repository.records.splice(0, repository.records.length, ...remaining);
    }
    const estimatedConversation = await f.operations.createAiConversation({
      actor,
      body: { title: "Estimated fallback" },
    });
    await f.operations.sendAiMessage({
      actor,
      params: { id: estimatedConversation._id },
      body: { content: "Suggest another vegan recipe" },
    });
    const estimatedPrompt = JSON.stringify(f.provider.generate.mock.calls[1][0]);
    expect(estimatedPrompt).toContain("estimated food");
    expect(estimatedPrompt).toContain("estimated recipe");
    expect(estimatedPrompt).not.toContain("unavailable food");
    expect(estimatedPrompt).not.toContain("unavailable recipe");

    for (const repository of [f.repos.foodItems, f.repos.recipes]) {
      const remaining = repository.records.filter(
        (record) => record.nutritionDataQuality !== "estimated",
      );
      repository.records.splice(0, repository.records.length, ...remaining);
    }
    const unavailableConversation = await f.operations.createAiConversation({
      actor,
      body: { title: "Unavailable fallback" },
    });
    await f.operations.sendAiMessage({
      actor,
      params: { id: unavailableConversation._id },
      body: { content: "Suggest any remaining vegan recipe" },
    });
    const unavailablePrompt = JSON.stringify(f.provider.generate.mock.calls[2][0]);
    expect(unavailablePrompt).toContain("unavailable food");
    expect(unavailablePrompt).toContain("unavailable recipe");
    expect(unavailablePrompt).toContain("make no quantitative nutrition claim");
  });
  it("does not persist an orphaned user message when generation fails", async () => {
    const f = fixture();
    const c = await f.operations.createAiConversation({ actor, body: { title: "Cooking" } });
    f.provider.generate.mockRejectedValueOnce(new Error("provider rejected the request"));
    await expect(
      f.operations.sendAiMessage({
        actor,
        params: { id: c._id },
        body: { content: "What can I cook?" },
      }),
    ).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
    expect(f.repos.aiMessages.records).toHaveLength(0);
    expect(f.repos.aiRuns.records[0]).toMatchObject({
      feature: "chat",
      status: "failed",
      errorCode: "AI_PROVIDER_ERROR",
    });
  });
  it("blocks diagnosis and emergency requests without invoking provider", async () => {
    const f = fixture();
    const c = await f.operations.createAiConversation({ actor, body: { title: "Health" } });
    const result = await f.operations.sendAiMessage({
      actor,
      params: { id: c._id },
      body: { content: "I have chest pain, diagnose me" },
    });
    expect(result.content).toContain("emergency");
    expect(f.provider.generate).not.toHaveBeenCalled();
    expect(f.repos.aiRuns.records[0].status).toBe("blocked");
  });
  it("persists a clear allergen caution without exposing saved allergen IDs", async () => {
    const f = fixture();
    const allergenId = objectId();
    f.deps.services.users.getNutrition.mockResolvedValue({ allergenIds: [allergenId] });
    f.provider.planRetrieval = vi.fn(async () => ({
      data: {
        mode: "catalog",
        searchText: "dinner",
        recipeTerms: [],
        foodTerms: [],
        filters: {},
      },
    }));
    const conversation = await f.operations.createAiConversation({
      actor,
      body: { title: "Allergen safety" },
    });

    const result = await f.operations.sendAiMessage({
      actor,
      params: { id: conversation._id },
      body: { content: "Suggest a dinner" },
    });

    expect(result.safetyNotices).toEqual([
      expect.objectContaining({ code: "ALLERGEN_CAUTION", severity: "warning" }),
    ]);
    expect(JSON.stringify(result.safetyNotices)).not.toContain(allergenId);
    expect(f.repos.aiMessages.records.at(-1).safetyNotices).toEqual(result.safetyNotices);
    const history = await f.operations.getAiMessages({
      actor,
      params: { id: conversation._id },
    });
    const assistantMessage = history.data.findLast((message) => message.role === "assistant");
    expect(assistantMessage.safetyNotices).toEqual(result.safetyNotices);
  });
  it("creates a pending plan; confirms atomically once and retry returns persisted result", async () => {
    const f = fixture();
    const proposal = await f.operations.createMealPlanProposal({
      actor,
      body: { startDate: "2026-10-05", days: 1 },
    });
    expect(f.repos.mealPlans.records).toHaveLength(0);
    const request = {
      actor,
      params: { proposalId: proposal.proposalId },
      body: { activate: true },
    };
    const [a, b] = await Promise.all([
      f.operations.confirmMealPlanProposal(request),
      f.operations.confirmMealPlanProposal(request),
    ]);
    expect(a).toEqual(b);
    expect(f.repos.mealPlans.records).toHaveLength(1);
    expect(f.deps.services.mealPlans.createForUser.mock.calls[0][1]).toMatchObject({
      weekStartDate: "2026-10-05",
      days: [{ meals: [{ type: "lunch", recipeId }] }],
    });
    f.repos.aiProposals.records[0].expiresAt = new Date("2020-01-01");
    expect(await f.operations.confirmMealPlanProposal(request)).toEqual(a);
  });
  it("validates AI meal plans against authoritative nutrition targets when profile use is enabled", async () => {
    const f = fixture();
    f.deps.services.users.getNutrition.mockResolvedValue({
      dailyCalorieTarget: 500,
      proteinTargetG: 25,
      carbTargetG: 60,
      fatTargetG: 15,
      fiberTargetG: 10,
    });
    f.deps.services.recipes.getById.mockResolvedValue({
      _id: recipeId,
      status: "published",
      visibility: "public",
      isVegan: true,
      ingredients: [{ foodItemId: foodId }],
      allergenIds: [],
      nutritionPerServing: {
        caloriesKcal: 500,
        proteinG: 25,
        carbsG: 60,
        fatG: 15,
        fiberG: 10,
      },
    });
    await expect(
      f.operations.createMealPlanProposal({
        actor,
        body: { startDate: "2026-10-05", days: 1, useProfile: true },
      }),
    ).resolves.toMatchObject({ status: "pending" });
    f.outputs.meal_plan.days[0].meals[0].servings = 2;
    await expect(
      f.operations.createMealPlanProposal({
        actor,
        body: { startDate: "2026-10-05", days: 1, useProfile: true },
      }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });
  it("rejects foreign/expired proposals and rolls back failed resource writes", async () => {
    const f = fixture();
    const p = await f.operations.createMealPlanProposal({
      actor,
      body: { startDate: "2026-10-05", days: 1 },
    });
    await expect(
      f.operations.confirmMealPlanProposal({
        actor: { userId: other },
        params: { proposalId: p.proposalId },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    f.deps.services.mealPlans.createForUser.mockImplementationOnce(async () => {
      throw Error("failure");
    });
    await expect(
      f.operations.confirmMealPlanProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toThrow("failure");
    expect(f.repos.aiProposals.records[0].status).toBe("pending");
    f.repos.aiProposals.records[0].expiresAt = new Date("2020-01-01");
    await expect(
      f.operations.confirmMealPlanProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toMatchObject({ code: "AI_PROPOSAL_EXPIRED" });
  });
  it("rejects hallucinated recipes and malformed outputs", async () => {
    const f = fixture();
    f.deps.services.recipes.getById.mockResolvedValue(null);
    await expect(
      f.operations.createMealPlanProposal({ actor, body: { startDate: "2026-10-05", days: 1 } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    expect(f.repos.aiProposals.records).toHaveLength(0);
    f.outputs.ingredient_recognition = { items: [{ quantity: -1 }] };
    await expect(
      f.operations.recognizeIngredients({ actor, body: { mediaId } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    expect(f.repos.aiRuns.records.at(-1).status).toBe("failed");
  });
  it("recognition checks ready owner and requires explicit pantry confirmation", async () => {
    const f = fixture();
    const p = await f.operations.recognizeIngredients({ actor, body: { mediaId } });
    expect(f.repos.pantries.records).toHaveLength(0);
    await f.operations.confirmPantryProposal({ actor, params: { proposalId: p.proposalId } });
    expect(f.repos.pantries.records).toHaveLength(1);
    f.deps.services.media.getOwnedReady.mockResolvedValue({
      ownerId: other,
      status: "ready",
      kind: "image",
      url: "https://example.test",
    });
    await expect(
      f.operations.recognizeIngredients({ actor, body: { mediaId } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(f.provider.generate).toHaveBeenCalledTimes(1);
  });
  it("unresolved ingredients cannot be consumed and expiry is checked for pantry", async () => {
    const f = fixture();
    f.outputs.ingredient_recognition = {
      items: [{ name: "Unknown green", quantity: 1, unit: "piece" }],
    };
    const p = await f.operations.recognizeIngredients({ actor, body: { mediaId } });
    await expect(
      f.operations.confirmPantryProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toMatchObject({ code: "AI_UNRESOLVED_INGREDIENTS" });
    expect(f.repos.aiProposals.records[0].status).toBe("pending");
    expect(f.repos.pantries.records).toHaveLength(0);
    f.repos.aiProposals.records[0].expiresAt = new Date("2020-01-01");
    await expect(
      f.operations.confirmPantryProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toMatchObject({ code: "AI_PROPOSAL_EXPIRED" });
  });
  it("enforces seven-day plans and complete ordered summary chapters", async () => {
    const f = fixture();
    expect(
      f.validation.createMealPlanProposal.body.safeParse({ startDate: "2026-10-05", days: 8 })
        .success,
    ).toBe(false);
    f.outputs.video_summary.chapters = [{ title: "Intro", startSeconds: 0 }];
    await expect(
      f.operations.generateVideoSummary({ actor, body: { mediaId, transcript: "Cooking" } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });
  it("rechecks authoritative pantry food safety before consumption", async () => {
    const f = fixture();
    const p = await f.operations.recognizeIngredients({ actor, body: { mediaId } });
    f.deps.services.foodItems.getById.mockResolvedValue({
      _id: foodId,
      status: "active",
      isVegan: false,
    });
    await expect(
      f.operations.confirmPantryProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    expect(f.repos.aiProposals.records[0].status).toBe("pending");
    expect(f.repos.pantries.records).toHaveLength(0);
  });
  it("rejects owner unpublished recipes, unsafe foods and changed allergens at confirmation", async () => {
    const f = fixture();
    f.deps.services.recipes.getById.mockResolvedValueOnce({
      _id: recipeId,
      status: "pending_review",
      visibility: "public",
      ingredients: [{ foodItemId: foodId }],
    });
    await expect(
      f.operations.createMealPlanProposal({ actor, body: { startDate: "2026-10-05", days: 1 } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    f.deps.services.foodItems.getById.mockResolvedValueOnce({
      _id: foodId,
      status: "active",
      isVegan: false,
    });
    await expect(
      f.operations.createMealPlanProposal({ actor, body: { startDate: "2026-10-05", days: 1 } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    const p = await f.operations.createMealPlanProposal({
      actor,
      body: { startDate: "2026-10-05", days: 1 },
    });
    const allergenId = objectId();
    f.deps.services.users.getNutrition.mockResolvedValue({ allergenIds: [allergenId] });
    f.deps.services.foodItems.getById.mockResolvedValue({
      _id: foodId,
      status: "active",
      isVegan: true,
      allergenIds: [allergenId],
    });
    await expect(
      f.operations.confirmMealPlanProposal({ actor, params: { proposalId: p.proposalId } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    expect(f.repos.aiProposals.records[0].status).toBe("pending");
    expect(f.repos.mealPlans.records).toHaveLength(0);
    await expect(
      f.operations.recognizeIngredients({ actor, body: { mediaId } }),
    ).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });
  it("feedback upserts only against an owned run", async () => {
    const f = fixture();
    const p = await f.operations.recognizeIngredients({ actor, body: { mediaId } });
    await f.operations.submitAiFeedback({
      actor,
      params: { runId: p.runId },
      body: { rating: "helpful" },
    });
    await f.operations.submitAiFeedback({
      actor,
      params: { runId: p.runId },
      body: { rating: "not_helpful" },
    });
    expect(f.repos.aiFeedback.records).toHaveLength(1);
    expect(f.repos.aiFeedback.records[0].rating).toBe("not_helpful");
    await expect(
      f.operations.submitAiFeedback({
        actor: { userId: other },
        params: { runId: p.runId },
        body: { rating: "helpful" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it("video feature-specific output requires a transcript or video-capable provider", async () => {
    const f = fixture();
    await expect(
      f.operations.generateVideoSummary({ actor, body: { mediaId } }),
    ).rejects.toMatchObject({ code: "AI_VIDEO_UNSUPPORTED" });
    const result = await f.operations.generateVideoSummary({
      actor,
      body: { mediaId, transcript: "Cook beans with brown rice." },
    });
    expect(result.summary).toContain("vegan bowl");
    expect(f.provider.generate.mock.calls[0][0].feature).toBe("video_summary");
  });
});
describe("OpenAI-compatible native provider, offline", () => {
  const env = {
    ai: {
      enabled: true,
      baseUrl: "https://provider.example.test/v1/",
      apiKey: "never-log-key",
      chatModel: "chat",
      visionModel: "vision",
      timeoutMs: 10,
      maxRetries: 2,
    },
  };
  const schema = z.strictObject({ content: z.string() });
  const success = () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ content: "valid" }) } }],
      usage: { total_tokens: 9, secret: "bad" },
    }),
  });
  it("sends safety policy and schema, retries only temporary errors with bounded backoff", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValue(success());
    const sleep = vi.fn(async () => {});
    const p = createAiProvider({ env, fetchImpl, sleep });
    const result = await p.generate({
      feature: "chat",
      messages: [{ role: "user", content: "hello" }],
      schema,
    });
    expect(result.data).toEqual({ content: "valid" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(250);
    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(payload.messages[0].content).toBe(AI_SAFETY_PROMPT);
    expect(payload.response_format.type).toBe("json_schema");
    expect(payload.response_format.json_schema.strict).toBe(false);
    expect(payload).not.toHaveProperty("thinking");
    expect(result.usage).toEqual({ total_tokens: 9 });
  });
  it("uses Kimi structured-output settings and accepts a fenced JSON response", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '```json\n{"content":"xin chao"}\n```' } }],
      }),
    }));
    const provider = createAiProvider({
      env: {
        ai: {
          ...env.ai,
          baseUrl: "https://api.moonshot.ai/v1",
          chatModel: "kimi-k2.6",
        },
      },
      fetchImpl,
    });

    await expect(
      provider.generate({ feature: "chat", messages: [], schema }),
    ).resolves.toMatchObject({ data: { content: "xin chao" }, model: "kimi-k2.6" });
    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(payload.response_format.json_schema.strict).toBe(true);
    expect(payload.thinking).toEqual({ type: "disabled" });
  });
  it("builds a structured retrieval plan before catalog-grounded chat", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mode: "catalog",
                searchText: "protein dinner",
                recipeTerms: ["tofu bowl"],
                foodTerms: ["tofu"],
                filters: { maxCaloriesKcal: 500 },
              }),
            },
          },
        ],
      }),
    }));
    const provider = createAiProvider({ env, fetchImpl });

    await expect(
      provider.planRetrieval({
        question: "Món tối giàu đạm dưới 500 kcal",
        schema: chatRetrievalOutput,
        requestId: "plan-1",
      }),
    ).resolves.toMatchObject({
      data: { mode: "catalog", filters: { maxCaloriesKcal: 500 } },
    });
    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(payload.response_format.json_schema.name).toBe("chat_retrieval");
    expect(payload.max_tokens).toBe(768);
    expect(payload.messages.at(-1).content).toContain("database retrieval plan");
  });
  it("does not retry auth errors or malformed structured JSON", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }));
    const p = createAiProvider({ env, fetchImpl, sleep: vi.fn() });
    await expect(p.generate({ feature: "chat", messages: [], schema })).rejects.toMatchObject({
      code: "AI_AUTHENTICATION_ERROR",
      statusCode: 503,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    fetchImpl.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"wrong":1}' } }] }),
    });
    await expect(p.generate({ feature: "chat", messages: [], schema })).rejects.toMatchObject({
      code: "AI_INVALID_OUTPUT",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it("logs upstream status for operators without logging credentials or user content", async () => {
    const logger = { warn: vi.fn() };
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }));
    const provider = createAiProvider({ env, fetchImpl, logger });
    await expect(
      provider.generate({
        feature: "chat",
        requestId: "qa-request",
        messages: [{ role: "user", content: "private meal preferences" }],
        schema,
      }),
    ).rejects.toMatchObject({ code: "AI_AUTHENTICATION_ERROR" });
    expect(logger.warn).toHaveBeenCalledWith(
      {
        feature: "chat",
        requestId: "qa-request",
        attempt: 1,
        code: "AI_AUTHENTICATION_ERROR",
        upstreamStatus: 401,
      },
      "AI provider request failed",
    );
    const logs = JSON.stringify(logger.warn.mock.calls);
    expect(logs).not.toContain(env.ai.apiKey);
    expect(logs).not.toContain("private meal preferences");
    expect(logs).not.toContain(env.ai.baseUrl);
  });
  it("timeout aborts even an injected fetch that does not observe AbortSignal", async () => {
    const fetchImpl = vi.fn(() => new Promise(() => {}));
    const p = createAiProvider({ env: { ai: { ...env.ai, maxRetries: 0 } }, fetchImpl });
    await expect(p.generate({ feature: "chat", messages: [], schema })).rejects.toMatchObject({
      code: "AI_TIMEOUT",
    });
    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("disabled never calls fetch and vision uses configured model", async () => {
    const fetchImpl = vi.fn(async () => success());
    const p = createAiProvider({ env: { ai: { ...env.ai, enabled: false } }, fetchImpl });
    await expect(p.generate({ feature: "chat", schema, messages: [] })).rejects.toMatchObject({
      code: "AI_DISABLED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    await createAiProvider({ env, fetchImpl }).generate({
      feature: "ingredient_recognition",
      schema,
      messages: [],
      mediaUrl: "https://media.example.test/signed",
    });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).model).toBe("vision");
  });
});
