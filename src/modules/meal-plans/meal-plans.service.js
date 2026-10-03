import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { normalizeNutrition, scaleNutrition, sumNutrition } from "../../common/utils/nutrition.js";
import { mergeIngredients, subtractPantry } from "../../common/utils/units.js";
import { mealPlanInput } from "./meal-plans.validation.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
const dateString = (value) => new Date(value).toISOString().slice(0, 10);
const nutritionSummary = (days) =>
  sumNutrition(
    days.flatMap((day) =>
      day.meals.map((meal) =>
        scaleNutrition(meal.recipeSnapshot.nutritionPerServing, meal.servings),
      ),
    ),
  );
const copyDays = (days) =>
  days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }));

export function createMealPlansService({
  mealPlansRepository: repo,
  mealPlanActiveSlotsRepository: slots,
  services = {},
  clock = () => new Date(),
  transaction,
}) {
  const now = () => new Date(typeof clock === "function" ? clock() : clock.now());
  async function getOwned(userId, id, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const plan = await repo.findOne({ _id: id, userId }, options);
    if (!plan) throw AppError.notFound("Meal plan not found");
    return plan;
  }
  async function snapshotMeal(userId, input, options = {}) {
    if (!services.recipes?.getById)
      throw AppError.serviceUnavailable("Recipe service is unavailable");
    const recipe = await services.recipes.getById(input.recipeId, {
      actor: { userId },
      session: options.session,
    });
    if (!recipe) throw AppError.notFound("Recipe not found");
    if (!recipe.nutritionPerServing || !Number.isFinite(recipe.servings) || recipe.servings <= 0)
      throw AppError.badRequest("Recipe has no usable nutrition snapshot");
    return {
      mealId: randomUUID(),
      type: input.type,
      recipeId: input.recipeId,
      servings: input.servings ?? 1,
      note: input.note,
      completed: false,
      recipeSnapshot: {
        title: recipe.title,
        servings: recipe.servings,
        ingredients: (recipe.ingredients ?? []).map((item) => ({
          foodItemId: item.foodItemId,
          foodNameSnapshot: item.foodNameSnapshot,
          quantity: item.quantity,
          unit: item.unit,
          ...(item.gramEquivalent ? { gramEquivalent: item.gramEquivalent } : {}),
          optional: Boolean(item.optional),
        })),
        nutritionPerServing: normalizeNutrition(recipe.nutritionPerServing),
      },
    };
  }
  async function createForUser(userId, body, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const parsed = mealPlanInput.parse(body);
    const days = [];
    // MongoDB sessions do not support parallel operations inside a transaction.
    for (const day of parsed.days) {
      const meals = [];
      for (const input of day.meals) meals.push(await snapshotMeal(userId, input, options));
      days.push({ date: new Date(`${day.date}T00:00:00Z`), meals });
    }
    return repo.create(
      {
        userId,
        title: parsed.title,
        weekStartDate: new Date(`${parsed.weekStartDate}T00:00:00Z`),
        days,
        status: "draft",
        nutritionSummary: nutritionSummary(days),
        version: 0,
      },
      options,
    );
  }
  async function change(userId, id, fn, options = {}) {
    const plan = await getOwned(userId, id, options);
    const set = await fn({ ...plan, days: copyDays(plan.days) });
    if (!set) return plan;
    if (set.days) set.nutritionSummary = nutritionSummary(set.days);
    const result = await repo.updateOne(
      { _id: id, userId, version: plan.version === undefined ? { $exists: false } : plan.version },
      { $set: set, $inc: { version: 1 } },
      options,
    );
    if (!result) throw AppError.conflict("Meal plan changed concurrently; retry your request");
    return result;
  }
  async function updateSlot(userId, weekStartDate, activePlanId, session, expectedPlanId) {
    if (!slots) throw AppError.serviceUnavailable("Active-plan slots are unavailable");
    const existing = await slots.findOne({ userId, weekStartDate }, { session });
    if (expectedPlanId && (!existing || String(existing.activePlanId) !== String(expectedPlanId))) {
      throw AppError.conflict("Active-plan data requires migration reconciliation");
    }
    if (!existing)
      return slots.create({ userId, weekStartDate, activePlanId, version: 0 }, { session });
    const updated = await slots.updateOne(
      {
        _id: existing._id,
        userId,
        weekStartDate,
        ...(expectedPlanId ? { activePlanId: expectedPlanId } : {}),
        version: existing.version === undefined ? { $exists: false } : existing.version,
      },
      { $set: { activePlanId }, $inc: { version: 1 } },
      { session },
    );
    if (!updated) throw AppError.conflict("Active meal-plan slot changed concurrently");
    return updated;
  }
  async function runTransaction(work, session) {
    if (session) return work(session);
    if (!transaction)
      throw AppError.serviceUnavailable(
        "Activation requires transaction support",
        "TRANSACTIONS_REQUIRED",
      );
    // A concurrent first-slot insert aborts its transaction on the unique owner/week key.
    // Only retry the complete transaction, never run more queries on that session.
    for (let attempt = 0; ; attempt++) {
      try {
        return await transaction(work);
      } catch (error) {
        if (error.code !== 11000 || attempt >= 2) throw error;
      }
    }
  }
  async function activate(userId, id, { session } = {}) {
    return runTransaction(async (session) => {
      const target = await getOwned(userId, id, { session });
      if (target.status === "archived")
        throw AppError.conflict("Archived plans cannot be activated");
      // Write the stable guard before inspecting/updating active statuses. Across processes,
      // concurrent activation transactions conflict on this one document and retry fresh.
      await updateSlot(userId, target.weekStartDate, target._id, session);
      const active = await repo.findMany(
        { userId, weekStartDate: target.weekStartDate, status: "active" },
        { page: 1, limit: 2, session },
      );
      if (active.data.length > 1)
        throw AppError.conflict("Active-plan data requires migration reconciliation");
      const previous = active.data.find((plan) => String(plan._id) !== String(target._id));
      if (previous) {
        const updated = await repo.updateOne(
          {
            _id: previous._id,
            userId,
            status: "active",
            version: previous.version === undefined ? { $exists: false } : previous.version,
          },
          { $set: { status: "archived" }, $inc: { version: 1 } },
          { session },
        );
        if (!updated) throw AppError.conflict("Active meal plan changed concurrently");
      }
      if (target.status === "active") return target;
      const updated = await repo.updateOne(
        {
          _id: id,
          userId,
          status: "draft",
          version: target.version === undefined ? { $exists: false } : target.version,
        },
        { $set: { status: "active" }, $inc: { version: 1 } },
        { session },
      );
      if (!updated) throw AppError.conflict("Meal plan changed concurrently");
      return updated;
    }, session);
  }
  async function setPlanStatus(userId, id, body) {
    return runTransaction(async (session) => {
      const plan = await getOwned(userId, id, { session });
      if (plan.status === "active" && body.status && body.status !== "active") {
        await updateSlot(userId, plan.weekStartDate, null, session, plan._id);
      }
      return change(userId, id, () => body, { session });
    });
  }
  async function groceryIngredients(userId, id, options = {}) {
    const plan = await getOwned(userId, id, options);
    const ingredients = plan.days.flatMap((day) =>
      day.meals.flatMap((meal) => {
        const factor = meal.servings / meal.recipeSnapshot.servings;
        return meal.recipeSnapshot.ingredients
          .filter((item) => !item.optional)
          .map((item) => ({
            ...item,
            nameSnapshot: item.foodNameSnapshot,
            quantity: item.quantity * factor,
            ...(item.gramEquivalent ? { gramEquivalent: item.gramEquivalent * factor } : {}),
          }));
      }),
    );
    // Explicit defaultServing equivalents may resolve count-to-mass. No invented density.
    const resolved = [];
    for (const item of ingredients) {
      if (
        item.gramEquivalent ||
        ["g", "kg", "ml", "l"].includes(item.unit) ||
        !services.foodItems?.getById
      ) {
        resolved.push(item);
        continue;
      }
      const food = await services.foodItems.getById(String(item.foodItemId), {
        actor: { userId },
        session: options.session,
        allowInactive: true,
      });
      resolved.push({ ...item, defaultServing: food?.defaultServing });
    }
    return mergeIngredients(resolved);
  }
  async function generateGroceryList(userId, id, body = {}, options = {}) {
    const plan = await getOwned(userId, id, options);
    let items = await groceryIngredients(userId, id, options);
    if (body.subtractPantry) {
      if (!services.pantries?.getForUser)
        throw AppError.serviceUnavailable("Pantry service is unavailable");
      const pantry = await services.pantries.getForUser(userId, options);
      const stock = [];
      for (const item of pantry.items.filter(
        (item) => !item.expiresAt || new Date(item.expiresAt) >= now(),
      )) {
        if (["g", "kg"].includes(item.unit) || !services.foodItems?.getById) {
          stock.push(item);
          continue;
        }
        const food = await services.foodItems.getById(String(item.foodItemId), {
          actor: { userId },
          session: options.session,
          allowInactive: true,
        });
        stock.push({ ...item, defaultServing: food.defaultServing });
      }
      items = subtractPantry(items, stock);
    }
    if (!services.groceryLists?.createForUser)
      throw AppError.serviceUnavailable("Grocery list service is unavailable");
    return services.groceryLists.createForUser(
      userId,
      {
        name: body.name ?? `Groceries for ${plan.title}`.slice(0, 200),
        items: items.map((item) => ({
          foodItemId: String(item.foodItemId),
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unit: item.unit,
        })),
      },
      { ...options, sourceMealPlanId: id, trustedMealPlanSnapshots: true },
    );
  }
  const operations = {
    getMealPlans: async ({ actor, query = {} }) =>
      repo.findMany(
        {
          userId: owner(actor),
          ...(query.weekStartDate
            ? { weekStartDate: new Date(`${query.weekStartDate}T00:00:00Z`) }
            : {}),
          ...(query.status ? { status: query.status } : {}),
        },
        { page: query.page, limit: query.limit, sort: { weekStartDate: -1, _id: -1 } },
      ),
    getCurrentMealPlan: async ({ actor, query = {} }) => {
      const day = query.date ?? dateString(now());
      return repo.findOne({
        userId: owner(actor),
        status: "active",
        weekStartDate: {
          $lte: new Date(`${day}T00:00:00Z`),
          $gt: new Date(new Date(`${day}T00:00:00Z`).getTime() - 7 * 86400000),
        },
      });
    },
    getMealPlan: async ({ actor, params }) => getOwned(owner(actor), params.id),
    createMealPlan: async ({ actor, body }) => createForUser(owner(actor), body),
    updateMealPlan: async ({ actor, params, body }) =>
      body.status
        ? setPlanStatus(owner(actor), params.id, body)
        : change(owner(actor), params.id, () => body),
    deleteMealPlan: async ({ actor, params }) =>
      setPlanStatus(owner(actor), params.id, { status: "archived" }),
    addMealToPlan: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const meal = await snapshotMeal(userId, body);
      return change(userId, params.id, (plan) => {
        if (plan.status === "archived")
          throw AppError.conflict("Archived meal plans cannot be edited");
        const offset = new Date(body.date) - new Date(plan.weekStartDate);
        if (offset < 0 || offset >= 7 * 86400000)
          throw AppError.badRequest("Meal date must be within the plan week");
        let day = plan.days.find((day) => dateString(day.date) === body.date);
        if (!day) {
          day = { date: new Date(`${body.date}T00:00:00Z`), meals: [] };
          plan.days.push(day);
        }
        if (day.meals.length >= 12) throw AppError.badRequest("Day is limited to 12 meals");
        day.meals.push(meal);
        plan.days.sort((a, b) => new Date(a.date) - new Date(b.date));
        return { days: plan.days };
      });
    },
    updateMealInPlan: async ({ actor, params, body }) => {
      const userId = owner(actor);
      return change(userId, params.id, async (plan) => {
        if (plan.status === "archived")
          throw AppError.conflict("Archived meal plans cannot be edited");
        const meal = plan.days
          .flatMap((day) => day.meals)
          .find((meal) => meal.mealId === params.mealId);
        if (!meal) throw AppError.notFound("Meal not found");
        if (body.recipeId && body.recipeId !== String(meal.recipeId)) {
          const replacement = await snapshotMeal(userId, { ...meal, ...body });
          meal.recipeSnapshot = replacement.recipeSnapshot;
        }
        Object.assign(meal, body);
        // Completing a meal never consumes pantry without a separately confirmed request.
        return { days: plan.days };
      });
    },
    deleteMealFromPlan: async ({ actor, params }) =>
      change(owner(actor), params.id, (plan) => {
        if (plan.status === "archived")
          throw AppError.conflict("Archived meal plans cannot be edited");
        if (!plan.days.some((day) => day.meals.some((meal) => meal.mealId === params.mealId)))
          throw AppError.notFound("Meal not found");
        for (const day of plan.days)
          day.meals = day.meals.filter((meal) => meal.mealId !== params.mealId);
        return { days: plan.days };
      }),
    activateMealPlan: async ({ actor, params }) => activate(owner(actor), params.id),
    cloneMealPlan: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const plan = await getOwned(userId, params.id);
      const weekStartDate = new Date(`${body.weekStartDate}T00:00:00Z`);
      if (dateString(plan.weekStartDate) === body.weekStartDate)
        throw AppError.badRequest("Clone must target a different week");
      const shift = weekStartDate - new Date(plan.weekStartDate);
      const days = copyDays(plan.days).map((day) => ({
        date: new Date(new Date(day.date).getTime() + shift),
        meals: day.meals.map((meal) => ({ ...meal, mealId: randomUUID(), completed: false })),
      }));
      return repo.create({
        userId,
        weekStartDate,
        title: body.title ?? plan.title,
        days,
        status: "draft",
        nutritionSummary: nutritionSummary(days),
        version: 0,
      });
    },
    generateGroceryListFromPlan: async ({ actor, params, body }) =>
      generateGroceryList(owner(actor), params.id, body),
  };
  return {
    operations,
    publicService: {
      createForUser,
      activate,
      getOwned,
      generateGroceryList,
      generateGroceryListFromPlan: generateGroceryList,
      groceryIngredients,
    },
  };
}
