import { describe, expect, it, vi } from "vitest";
import { createPantriesModule } from "../../src/modules/pantries/index.js";
import { createMealPlansModule } from "../../src/modules/meal-plans/index.js";
import { createGroceryListsModule } from "../../src/modules/grocery-lists/index.js";
import { createDiaryModule } from "../../src/modules/diary/index.js";
import { createWeightLogsModule } from "../../src/modules/weight-logs/index.js";
import { createWaterLogsModule } from "../../src/modules/water-logs/index.js";
import {
  calculateRecipeNutrition,
  scaleNutrition,
  sumNutrition,
} from "../../src/common/utils/nutrition.js";
import {
  convertQuantity,
  quantityToGrams,
  mergeIngredients,
  subtractPantry,
} from "../../src/common/utils/units.js";
import { repository, transaction, newId } from "./planning.helpers.js";

const userId = newId();
const otherId = newId();
const foodId = newId();
const recipeId = newId();
const actor = { userId };
const clock = () => new Date("2026-10-03T12:00:00Z");
const food = {
  _id: foodId,
  name: "Tofu",
  status: "active",
  nutritionPer100g: { caloriesKcal: 100, proteinG: 10 },
  defaultServing: { amount: 1, unit: "piece", gramEquivalent: 50 },
};
const recipe = {
  _id: recipeId,
  title: "Tofu plate",
  servings: 2,
  ingredients: [{ foodItemId: foodId, foodNameSnapshot: "Tofu", quantity: 0.5, unit: "kg" }],
  nutritionPerServing: { caloriesKcal: 250, proteinG: 25 },
};
function setup(seed = {}) {
  const repositories = Object.fromEntries(
    [
      "pantries",
      "mealPlans",
      "mealPlanActiveSlots",
      "groceryLists",
      "diaryEntries",
      "weightLogs",
      "waterLogs",
    ].map((key) => [key, repository(seed[key] ?? [])]),
  );
  const services = {
    foodItems: { getById: vi.fn(async () => food) },
    recipes: {
      getById: vi.fn(async () => recipe),
      listPublic: vi.fn(async () => ({
        data: [recipe],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
  };
  const deps = {
    repositories,
    services,
    clock,
    transaction: transaction(Object.values(repositories)),
  };
  const modules = {};
  for (const [key, factory] of Object.entries({
    pantries: createPantriesModule,
    mealPlans: createMealPlansModule,
    groceryLists: createGroceryListsModule,
    diary: createDiaryModule,
    weightLogs: createWeightLogsModule,
    waterLogs: createWaterLogsModule,
  })) {
    modules[key] = factory(deps);
    Object.assign(services, modules[key].services);
  }
  return { repositories, services, modules };
}
const planBody = {
  title: "Week",
  weekStartDate: "2026-10-05",
  days: [{ date: "2026-10-05", meals: [{ type: "lunch", recipeId, servings: 2 }] }],
};

describe("planning pure calculations", () => {
  it("scales all nutrients and calculates explicit whole-quantity grams per serving", () => {
    const nutrients = calculateRecipeNutrition(
      [
        {
          quantity: 2,
          unit: "piece",
          gramEquivalent: 200,
          nutritionPer100g: { caloriesKcal: 100, proteinG: 12 },
        },
      ],
      { servings: 2 },
    );
    expect(nutrients.caloriesKcal).toBe(100);
    expect(nutrients.proteinG).toBe(12);
    expect(sumNutrition([scaleNutrition(nutrients, 2), nutrients]).caloriesKcal).toBe(300);
    expect(() => scaleNutrition(nutrients, Infinity)).toThrow();
  });
  it("never invents density or spoon/cup metric conversion", () => {
    expect(convertQuantity(1, "kg", "g")).toBe(1000);
    expect(convertQuantity(1, "l", "ml")).toBe(1000);
    expect(convertQuantity(1, "ml", "g")).toBeNull();
    expect(convertQuantity(1, "cup", "ml")).toBeNull();
    expect(quantityToGrams(2, "piece", { defaultServing: food.defaultServing })).toBe(100);
    expect(quantityToGrams(2, "cup")).toBeNull();
    expect(() =>
      calculateRecipeNutrition([{ quantity: 1, unit: "cup", nutritionPer100g: {} }]),
    ).toThrow(/gram equivalent/);
  });
  it("merges only genuinely compatible ingredient quantities", () => {
    const items = mergeIngredients([
      { foodItemId: foodId, quantity: 500, unit: "g" },
      { foodItemId: foodId, quantity: 1, unit: "kg" },
      { foodItemId: foodId, quantity: 1, unit: "cup" },
      { foodItemId: foodId, quantity: 2, unit: "ml" },
    ]);
    expect(items).toHaveLength(3);
    expect(items.find((item) => item.unit === "g").quantity).toBe(1500);
    const subtracted = subtractPantry(items, [
      { foodItemId: foodId, quantity: 1, unit: "kg" },
      { foodItemId: foodId, quantity: 0.5, unit: "cup" },
    ]);
    expect(subtracted.find((item) => item.unit === "g").quantity).toBe(500);
    expect(subtracted.find((item) => item.unit === "cup").quantity).toBe(0.5);
    expect(subtracted.find((item) => item.unit === "ml").quantity).toBe(2);
  });
});

describe("pantry owner aggregate and concurrency", () => {
  it("bulk replay is hash-bound and does not append duplicate embedded items", async () => {
    const { modules, services } = setup();
    const operations = modules.pantries.operations;
    const body = {
      items: [{ foodItemId: foodId, quantity: 1, unit: "kg" }],
      idempotencyKey: "bulk-1",
    };
    const first = await operations.addPantryItemsBulk({ actor, body });
    const again = await operations.addPantryItemsBulk({ actor, body });
    expect(again.items).toHaveLength(1);
    expect(again.items[0].itemId).toBe(first.items[0].itemId);
    expect(services.foodItems.getById).toHaveBeenCalledTimes(1);
    await expect(
      operations.addPantryItemsBulk({
        actor,
        body: { ...body, items: [{ foodItemId: foodId, quantity: 2, unit: "kg" }] },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it("concurrent different additions survive CAS retries and same-key requests deduplicate", async () => {
    const { modules } = setup();
    const service = modules.pantries.services.pantries;
    await service.getForUser(userId);
    await Promise.all([
      service.addItems(userId, [{ foodItemId: foodId, quantity: 1, unit: "g" }]),
      service.addItems(userId, [{ foodItemId: foodId, quantity: 2, unit: "g" }]),
    ]);
    expect((await service.getForUser(userId)).items).toHaveLength(2);
    await Promise.all(
      [1, 2].map(() =>
        service.addItems(userId, [{ foodItemId: foodId, quantity: 5, unit: "g" }], {
          idempotencyKey: "same",
        }),
      ),
    );
    expect((await service.getForUser(userId)).items).toHaveLength(3);
  });
  it("child delete preserves parent and other user cannot mutate item", async () => {
    const { modules, repositories } = setup();
    const ops = modules.pantries.operations;
    const pantry = await ops.addPantryItem({
      actor,
      body: { foodItemId: foodId, quantity: 1, unit: "piece" },
    });
    const itemId = pantry.items[0].itemId;
    await expect(
      ops.deletePantryItem({ actor: { userId: otherId }, params: { itemId } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    const deleted = await ops.deletePantryItem({ actor, params: { itemId } });
    expect(deleted._id).toBe(pantry._id);
    expect(deleted.items).toEqual([]);
    expect(repositories.pantries.calls.some((call) => call.method === "deleteOne")).toBe(false);
  });
  it("propagates duplicate creation on supplied sessions without querying the aborted session", async () => {
    const { modules, repositories } = setup();
    const duplicate = Object.assign(new Error("duplicate pantry"), { code: 11000 });
    const findOne = vi.spyOn(repositories.pantries, "findOne");
    vi.spyOn(repositories.pantries, "updateOne").mockRejectedValue(duplicate);
    await expect(
      modules.pantries.services.pantries.getForUser(userId, { session: { supplied: true } }),
    ).rejects.toBe(duplicate);
    expect(findOne).toHaveBeenCalledTimes(1);
  });
  it("re-reads a concurrent pantry creation only outside a supplied session", async () => {
    const { modules, repositories } = setup();
    const concurrent = { _id: newId(), userId, items: [], version: 0 };
    const findOne = vi
      .spyOn(repositories.pantries, "findOne")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent);
    vi.spyOn(repositories.pantries, "updateOne").mockRejectedValue(
      Object.assign(new Error("duplicate pantry"), { code: 11000 }),
    );
    expect(await modules.pantries.services.pantries.getForUser(userId)).toMatchObject(concurrent);
    expect(findOne).toHaveBeenCalledTimes(2);
  });
  it("finds only expiring owner items and matches pantry recipes", async () => {
    const { modules } = setup();
    const ops = modules.pantries.operations;
    await ops.addPantryItem({
      actor,
      body: { foodItemId: foodId, quantity: 1, unit: "kg", expiresAt: "2026-10-04T12:00:00Z" },
    });
    expect((await ops.getExpiringPantryItems({ actor, query: { days: 3 } })).data).toHaveLength(1);
    expect((await ops.getPantryRecipeSuggestions({ actor, query: {} })).data[0]).toMatchObject({
      matchRatio: 1,
      sufficientCount: 1,
    });
  });
});

describe("meal plans and grocery child isolation", () => {
  it("snapshot nutrition, child completion and delete preserve aggregate", async () => {
    const { modules, repositories } = setup();
    const ops = modules.mealPlans.operations;
    const plan = await ops.createMealPlan({ actor, body: planBody });
    expect(plan.nutritionSummary.caloriesKcal).toBe(500);
    const mealId = plan.days[0].meals[0].mealId;
    await ops.updateMealInPlan({
      actor,
      params: { id: plan._id, mealId },
      body: { completed: true, servings: 1 },
    });
    const updated = await ops.getMealPlan({ actor, params: { id: plan._id } });
    expect(updated.nutritionSummary.caloriesKcal).toBe(250);
    expect(updated.days[0].meals[0].completed).toBe(true);
    expect(repositories.pantries.records).toHaveLength(0);
    const removed = await ops.deleteMealFromPlan({ actor, params: { id: plan._id, mealId } });
    expect(removed._id).toBe(plan._id);
    expect(removed.days[0].meals).toHaveLength(0);
    expect(removed.nutritionSummary.caloriesKcal).toBe(0);
    expect(repositories.mealPlans.calls.some((call) => call.method === "deleteOne")).toBe(false);
  });
  it("switches active plans sequentially through one stable owner/week slot", async () => {
    const { modules, repositories } = setup();
    const service = modules.mealPlans.services.mealPlans;
    const first = await service.createForUser(userId, planBody);
    const second = await service.createForUser(userId, planBody);
    await service.activate(userId, first._id);
    const initialSlot = { ...repositories.mealPlanActiveSlots.records[0] };
    await service.activate(userId, second._id);
    expect(repositories.mealPlanActiveSlots.records).toHaveLength(1);
    expect(repositories.mealPlanActiveSlots.records[0]).toMatchObject({
      _id: initialSlot._id,
      userId,
      weekStartDate: new Date("2026-10-05T00:00:00Z"),
      activePlanId: second._id,
      version: initialSlot.version + 1,
    });
    expect(repositories.mealPlans.records.find((row) => row._id === first._id).status).toBe(
      "archived",
    );
    expect(repositories.mealPlans.records.find((row) => row._id === second._id).status).toBe(
      "active",
    );
  });
  it("keeps slots isolated by owner and week", async () => {
    const { modules, repositories } = setup();
    const service = modules.mealPlans.services.mealPlans;
    const plans = [
      await service.createForUser(userId, planBody),
      await service.createForUser(otherId, planBody),
      await service.createForUser(userId, { ...planBody, weekStartDate: "2026-10-12", days: [] }),
    ];
    for (const plan of plans) await service.activate(plan.userId, plan._id);
    expect(repositories.mealPlanActiveSlots.records).toHaveLength(3);
    expect(repositories.mealPlans.records.filter((row) => row.status === "active")).toHaveLength(3);
    await expect(service.activate(otherId, plans[0]._id)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(
      repositories.mealPlanActiveSlots.records.map((slot) => slot.activePlanId).sort(),
    ).toEqual(plans.map((plan) => plan._id).sort());
  });
  it("activates atomically under concurrency and rolls back failed switch", async () => {
    const { modules, repositories } = setup();
    const service = modules.mealPlans.services.mealPlans;
    const first = await service.createForUser(userId, planBody);
    const second = await service.createForUser(userId, planBody);
    await Promise.all([service.activate(userId, first._id), service.activate(userId, second._id)]);
    expect(repositories.mealPlans.records.filter((row) => row.status === "active")).toHaveLength(1);
    expect(repositories.mealPlanActiveSlots.records).toHaveLength(1);
    expect(repositories.mealPlanActiveSlots.records[0].activePlanId).toBe(second._id);
    const slotBeforeFailure = { ...repositories.mealPlanActiveSlots.records[0] };
    const third = await service.createForUser(userId, planBody);
    const originalUpdate = repositories.mealPlans.updateOne;
    repositories.mealPlans.updateOne = async (filter, update, options) => {
      if (filter._id === third._id) throw new Error("simulated write failure");
      return originalUpdate(filter, update, options);
    };
    await expect(service.activate(userId, third._id)).rejects.toThrow("simulated write failure");
    expect(repositories.mealPlans.records.find((row) => row._id === second._id).status).toBe(
      "active",
    );
    expect(repositories.mealPlanActiveSlots.records[0]).toEqual(slotBeforeFailure);
  });
  it.each(["draft", "archived", "delete"])(
    "clears the stable slot transactionally on active-plan %s",
    async (transition) => {
      const { modules, repositories } = setup();
      const plan = await modules.mealPlans.services.mealPlans.createForUser(userId, planBody);
      await modules.mealPlans.services.mealPlans.activate(userId, plan._id);
      const slotId = repositories.mealPlanActiveSlots.records[0]._id;
      const ops = modules.mealPlans.operations;
      if (transition === "delete") await ops.deleteMealPlan({ actor, params: { id: plan._id } });
      else
        await ops.updateMealPlan({ actor, params: { id: plan._id }, body: { status: transition } });
      expect(repositories.mealPlanActiveSlots.records[0]).toMatchObject({
        _id: slotId,
        activePlanId: null,
        version: 1,
      });
      expect(repositories.mealPlans.records[0].status).toBe(
        transition === "delete" ? "archived" : transition,
      );
    },
  );
  it("rolls back a slot clear if the plan status write fails", async () => {
    const { modules, repositories } = setup();
    const plan = await modules.mealPlans.services.mealPlans.createForUser(userId, planBody);
    await modules.mealPlans.services.mealPlans.activate(userId, plan._id);
    const previousSlot = { ...repositories.mealPlanActiveSlots.records[0] };
    vi.spyOn(repositories.mealPlans, "updateOne").mockRejectedValue(
      new Error("status write failed"),
    );
    await expect(
      modules.mealPlans.operations.deleteMealPlan({ actor, params: { id: plan._id } }),
    ).rejects.toThrow("status write failed");
    expect(repositories.mealPlanActiveSlots.records[0]).toEqual(previousSlot);
    expect(repositories.mealPlans.records[0].status).toBe("active");
  });
  it.each(["missing", "different-plan"])(
    "rejects legacy active-plan deactivation with a %s slot without corrupting data",
    async (kind) => {
      const { modules, repositories } = setup();
      const plan = await modules.mealPlans.services.mealPlans.createForUser(userId, planBody);
      repositories.mealPlans.records[0].status = "active";
      const foreignPointer = newId();
      if (kind === "different-plan")
        await repositories.mealPlanActiveSlots.create({
          userId,
          weekStartDate: plan.weekStartDate,
          activePlanId: foreignPointer,
          version: 0,
        });
      await expect(
        modules.mealPlans.operations.deleteMealPlan({ actor, params: { id: plan._id } }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(repositories.mealPlans.records[0].status).toBe("active");
      expect(repositories.mealPlanActiveSlots.records).toHaveLength(kind === "missing" ? 0 : 1);
      if (kind === "different-plan")
        expect(repositories.mealPlanActiveSlots.records[0].activePlanId).toBe(foreignPointer);
    },
  );
  it("retries first-slot unique collisions only by rerunning the whole transaction", async () => {
    const { modules, repositories } = setup();
    const plan = await modules.mealPlans.services.mealPlans.createForUser(userId, planBody);
    const create = repositories.mealPlanActiveSlots.create;
    const sessions = [];
    vi.spyOn(repositories.mealPlanActiveSlots, "create").mockImplementation(
      async (data, options) => {
        sessions.push(options.session);
        if (sessions.length === 1)
          throw Object.assign(new Error("duplicate slot"), { code: 11000 });
        return create(data, options);
      },
    );
    await modules.mealPlans.services.mealPlans.activate(userId, plan._id);
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).not.toBe(sessions[1]);
    expect(repositories.mealPlanActiveSlots.records[0].activePlanId).toBe(plan._id);
    const third = await modules.mealPlans.services.mealPlans.createForUser(userId, {
      ...planBody,
      weekStartDate: "2026-10-12",
      days: [],
    });
    const duplicate = Object.assign(new Error("duplicate supplied slot"), { code: 11000 });
    vi.spyOn(repositories.mealPlanActiveSlots, "create").mockRejectedValue(duplicate);
    const findManyCalls = repositories.mealPlans.calls.filter(
      (call) => call.method === "findMany",
    ).length;
    await expect(
      modules.mealPlans.services.mealPlans.activate(userId, third._id, {
        session: { supplied: true },
      }),
    ).rejects.toBe(duplicate);
    expect(repositories.mealPlans.calls.filter((call) => call.method === "findMany")).toHaveLength(
      findManyCalls,
    );
  });
  it("clone shifts dates and resets completion without re-resolving recipe snapshot", async () => {
    const { modules, services } = setup();
    const ops = modules.mealPlans.operations;
    const plan = await ops.createMealPlan({ actor, body: planBody });
    const mealId = plan.days[0].meals[0].mealId;
    await ops.updateMealInPlan({
      actor,
      params: { id: plan._id, mealId },
      body: { completed: true },
    });
    const cloned = await ops.cloneMealPlan({
      actor,
      params: { id: plan._id },
      body: { weekStartDate: "2026-10-12" },
    });
    expect(cloned.status).toBe("draft");
    expect(cloned.days[0].date).toEqual(new Date("2026-10-12T00:00:00Z"));
    expect(cloned.days[0].meals[0].completed).toBe(false);
    expect(cloned.days[0].meals[0].mealId).not.toBe(mealId);
    expect(services.recipes.getById).toHaveBeenCalledTimes(1);
  });
  it("preserves historical ingredient names after rename and inactivation without weakening manual creation", async () => {
    const { modules, services } = setup();
    const plan = await services.mealPlans.createForUser(userId, planBody);
    services.foodItems.getById.mockResolvedValue({ ...food, name: "Renamed tofu" });
    const historical = await services.mealPlans.generateGroceryList(userId, plan._id);
    expect(historical.items[0].nameSnapshot).toBe("Tofu");
    expect(services.foodItems.getById).not.toHaveBeenCalled();
    const manual = await services.groceryLists.createForUser(userId, {
      name: "Manual",
      items: [{ foodItemId: foodId, nameSnapshot: "Untrusted name", quantity: 1, unit: "g" }],
    });
    expect(manual.items[0].nameSnapshot).toBe("Renamed tofu");
    services.foodItems.getById.mockImplementation(async (_id, options = {}) => {
      if (!options.allowInactive)
        throw Object.assign(new Error("Inactive food unavailable"), { statusCode: 404 });
      return { ...food, status: "inactive", name: "Renamed tofu" };
    });
    const inactiveHistorical = await services.mealPlans.generateGroceryList(userId, plan._id);
    expect(inactiveHistorical.items[0].nameSnapshot).toBe("Tofu");
    await expect(
      services.groceryLists.createForUser(userId, {
        name: "Manual",
        items: [{ foodItemId: foodId, nameSnapshot: "Untrusted name", quantity: 1, unit: "g" }],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      services.groceryLists.createForUser(
        otherId,
        {
          name: "Foreign",
          items: [{ foodItemId: foodId, nameSnapshot: "Tofu", quantity: 1, unit: "g" }],
        },
        { sourceMealPlanId: plan._id, trustedMealPlanSnapshots: true },
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it("resolves explicit pantry serving mass before subtracting canonical demand", async () => {
    const { services } = setup();
    const plan = await services.mealPlans.createForUser(userId, planBody);
    await services.pantries.addItems(userId, [{ foodItemId: foodId, quantity: 1, unit: "piece" }]);
    services.foodItems.getById.mockResolvedValue({
      ...food,
      status: "inactive",
      defaultServing: { amount: 1, unit: "piece", gramEquivalent: 100 },
    });
    const session = { supplied: true };
    const list = await services.mealPlans.generateGroceryList(
      userId,
      plan._id,
      { subtractPantry: true },
      { session },
    );
    expect(list.items[0]).toMatchObject({ quantity: 400, unit: "g", nameSnapshot: "Tofu" });
    expect(services.foodItems.getById).toHaveBeenLastCalledWith(foodId, {
      actor: { userId },
      session,
      allowInactive: true,
    });
    services.foodItems.getById.mockResolvedValue({
      ...food,
      defaultServing: { amount: 1, unit: "piece" },
    });
    const unknown = await services.mealPlans.generateGroceryList(userId, plan._id, {
      subtractPantry: true,
    });
    expect(unknown.items[0]).toMatchObject({ quantity: 500, unit: "g" });
  });
  it("uses explicit serving equivalents for historical count ingredients while preserving unknown units", async () => {
    const { services } = setup();
    services.recipes.getById.mockResolvedValue({
      ...recipe,
      ingredients: [
        { foodItemId: foodId, foodNameSnapshot: "Original tofu", quantity: 2, unit: "piece" },
        { foodItemId: foodId, foodNameSnapshot: "Original tofu", quantity: 1, unit: "cup" },
      ],
    });
    const plan = await services.mealPlans.createForUser(userId, planBody);
    services.foodItems.getById.mockResolvedValue({
      ...food,
      status: "inactive",
      name: "Renamed tofu",
    });
    const list = await services.mealPlans.generateGroceryList(userId, plan._id);
    expect(list.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nameSnapshot: "Original tofu", quantity: 100, unit: "g" }),
        expect.objectContaining({ nameSnapshot: "Original tofu", quantity: 1, unit: "cup" }),
      ]),
    );
    expect(services.foodItems.getById).toHaveBeenCalledTimes(2);
    for (const [, options] of services.foodItems.getById.mock.calls)
      expect(options.allowInactive).toBe(true);
  });
  it("grocery generation scales recipe servings, subtracts confirmed pantry and clear is idempotent", async () => {
    const { modules, repositories } = setup();
    const plan = await modules.mealPlans.services.mealPlans.createForUser(userId, planBody);
    await modules.pantries.services.pantries.addItems(userId, [
      { foodItemId: foodId, quantity: 100, unit: "g" },
    ]);
    const list = await modules.mealPlans.services.mealPlans.generateGroceryList(userId, plan._id, {
      subtractPantry: true,
    });
    expect(list.items[0]).toMatchObject({ quantity: 400, unit: "g", checked: false });
    const itemId = list.items[0].itemId;
    const ops = modules.groceryLists.operations;
    await expect(
      ops.deleteGroceryItem({ actor: { userId: otherId }, params: { id: list._id, itemId } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await ops.updateGroceryItem({
      actor,
      params: { id: list._id, itemId },
      body: { checked: true },
    });
    const cleared = await ops.clearCheckedGroceryItems({ actor, params: { id: list._id } });
    const again = await ops.clearCheckedGroceryItems({ actor, params: { id: list._id } });
    expect(cleared.items).toEqual([]);
    expect(again.version).toBe(cleared.version);
    expect(repositories.groceryLists.records).toHaveLength(1);
    const manual = await ops.addGroceryItem({
      actor,
      params: { id: list._id },
      body: { nameSnapshot: "Bags", quantity: 2, unit: "piece" },
    });
    const removed = await ops.deleteGroceryItem({
      actor,
      params: { id: list._id, itemId: manual.items[0].itemId },
    });
    expect(removed._id).toBe(list._id);
    expect(repositories.groceryLists.records).toHaveLength(1);
  });
});

describe("diary snapshots and range log aggregation", () => {
  it("scales from immutable source basis after source nutrition changes", async () => {
    const { modules, services } = setup();
    const ops = modules.diary.operations;
    const entry = await ops.createDiaryEntry({
      actor,
      body: { date: "2026-10-03", mealType: "lunch", sourceType: "recipe", recipeId, servings: 2 },
    });
    expect(entry.nutritionSnapshot.caloriesKcal).toBe(500);
    expect(entry.nutritionBasis).toBeUndefined();
    services.recipes.getById.mockResolvedValue({
      ...recipe,
      nutritionPerServing: { caloriesKcal: 999 },
    });
    const edited = await ops.updateDiaryEntry({
      actor,
      params: { id: entry._id },
      body: { servings: 3 },
    });
    expect(edited.nutritionSnapshot.caloriesKcal).toBe(750);
    expect(services.recipes.getById).toHaveBeenCalledTimes(1);
    await expect(
      ops.updateDiaryEntry({
        actor: { userId: otherId },
        params: { id: entry._id },
        body: { servings: 4 },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    const summary = await ops.getDiarySummary({ actor, query: { date: "2026-10-03" } });
    expect(summary.nutrition.caloriesKcal).toBe(750);
    expect(summary.entryCount).toBe(1);
  });
  it("food diary compatible unit changes retain saved basis and reject incompatible units", async () => {
    const { modules } = setup();
    const ops = modules.diary.operations;
    const entry = await ops.createDiaryEntry({
      actor,
      body: {
        date: "2026-10-03",
        mealType: "snack",
        sourceType: "food",
        foodItemId: foodId,
        quantity: 100,
        unit: "g",
      },
    });
    const edited = await ops.updateDiaryEntry({
      actor,
      params: { id: entry._id },
      body: { quantity: 0.2, unit: "kg" },
    });
    expect(edited.nutritionSnapshot.caloriesKcal).toBe(200);
    await expect(
      ops.updateDiaryEntry({ actor, params: { id: entry._id }, body: { unit: "cup" } }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("water totals use full owner range, not page, and local day DST boundaries", async () => {
    const logs = [
      { userId, amountMl: 200, recordedAt: new Date("2026-11-01T07:30:00Z") },
      { userId, amountMl: 300, recordedAt: new Date("2026-11-02T07:30:00Z") },
      { userId, amountMl: 900, recordedAt: new Date("2026-11-02T08:30:00Z") },
      { userId: otherId, amountMl: 10000, recordedAt: new Date("2026-11-01T08:00:00Z") },
    ];
    const { modules } = setup({ waterLogs: logs });
    const result = await modules.waterLogs.operations.getWaterLogs({
      actor,
      query: { date: "2026-11-01", timezone: "America/Los_Angeles", page: 1, limit: 1 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(2);
    expect(result.meta.totalMl).toBe(500);
    expect(result.meta.days).toEqual([{ date: "2026-11-01", amountMl: 500, count: 2 }]);
  });
  it("weight trend orders timestamps and excludes other owner", async () => {
    const { modules } = setup({
      weightLogs: [
        { userId, weightKg: 75, recordedAt: new Date("2026-10-01T12:00:00Z") },
        { userId, weightKg: 74, recordedAt: new Date("2026-10-03T12:00:00Z") },
        { userId: otherId, weightKg: 100, recordedAt: new Date("2026-10-02T12:00:00Z") },
      ],
    });
    const result = await modules.weightLogs.operations.getWeightTrend({
      actor,
      query: { from: "2026-10-01", to: "2026-10-03" },
    });
    expect(result).toMatchObject({
      startWeightKg: 75,
      endWeightKg: 74,
      count: 2,
      changeKg: -1,
      averageChangeKgPerDay: -0.5,
    });
    await expect(
      modules.weightLogs.operations.getWeightLogs({
        actor,
        query: { from: "2025-01-01", to: "2026-10-03" },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("strict planning validation and persistence models", () => {
  it("rejects unknown authority fields, empty patches, invalid ids/ranges/embedded size", () => {
    const { modules } = setup();
    expect(
      modules.pantries.validation.addPantryItem.body.safeParse({
        foodItemId: foodId,
        quantity: 1,
        unit: "g",
        userId: otherId,
      }).success,
    ).toBe(false);
    expect(modules.groceryLists.validation.updateGroceryItem.body.safeParse({}).success).toBe(
      false,
    );
    expect(modules.mealPlans.validation.updateMealInPlan.body.safeParse({}).success).toBe(false);
    expect(modules.mealPlans.validation.updateMealInPlan.body.parse({ completed: true })).toEqual({
      completed: true,
    });
    expect(
      modules.mealPlans.validation.createMealPlan.body.safeParse({
        ...planBody,
        days: [{ ...planBody.days[0], date: "2026-11-01" }],
      }).success,
    ).toBe(false);
    expect(
      modules.diary.validation.createDiaryEntry.body.safeParse({
        date: "2026-02-30",
        sourceType: "recipe",
        recipeId,
        servings: 1,
        mealType: "lunch",
      }).success,
    ).toBe(false);
    expect(
      modules.waterLogs.validation.getWaterLogs.query.safeParse({
        from: "2026-10-03",
        to: "2026-10-01",
      }).success,
    ).toBe(false);
    expect(
      modules.weightLogs.validation.updateWeightLog.params.safeParse({ id: "bad" }).success,
    ).toBe(false);
  });
  it("uses explicit legacy collections, guarded typed models and stable owner/week slot uniqueness", () => {
    const { modules } = setup();
    expect(modules.pantries.models.PantriesModel.collection.name).toBe("pantries");
    expect(modules.diary.models.DiaryModel.collection.name).toBe("diaries");
    expect(modules.mealPlans.models.MealPlansModel.collection.name).toBe("mealplans");
    const slotModel = modules.mealPlans.models.MealPlanActiveSlotsModel;
    expect(slotModel.collection.name).toBe("mealplanactiveslots");
    expect(slotModel.schema.indexes()).toContainEqual([
      { userId: 1, weekStartDate: 1 },
      { unique: true, name: "one_active_slot_per_owner_week" },
    ]);
    expect(slotModel.schema.path("activePlanId").instance).toBe("ObjectId");
    expect(slotModel.schema.path("version").defaultValue).toBe(0);
    expect(
      modules.mealPlans.models.MealPlansModel.schema
        .indexes()
        .some(([, options]) => options.name === "one_active_plan_per_owner_week"),
    ).toBe(false);
    expect(
      modules.groceryLists.models.GroceryListsModel.schema.path("items").schema.path("foodItemId")
        .instance,
    ).toBe("ObjectId");
    expect(
      createPantriesModule({ repositories: { pantries: repository() } }).models.PantriesModel,
    ).toBe(modules.pantries.models.PantriesModel);
  });
});
