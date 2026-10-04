import mongoose from "mongoose";
import { AppError } from "../../common/errors/app-error.js";
import {
  normalizeNutrition,
  scaleNutrition,
  sumNutrition,
  NUTRIENT_KEYS,
} from "../../common/utils/nutrition.js";
import { convertQuantity, quantityToGrams } from "../../common/utils/units.js";
import { diaryInput } from "./diary.validation.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
const publicEntry = (entry) => {
  const { nutritionBasis, basisQuantity, basisUnit, ...data } = entry;
  return data;
};
const mongoId = (id) =>
  mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : id;
const targetFields = {
  caloriesKcal: "dailyCalorieTarget",
  proteinG: "proteinTargetG",
  carbsG: "carbTargetG",
  fatG: "fatTargetG",
  fiberG: "fiberTargetG",
};
const dailyTargets = (profile) =>
  Object.fromEntries(
    Object.entries(targetFields).map(([nutrient, field]) => [
      nutrient,
      Number.isFinite(profile?.[field]) && profile[field] > 0 ? profile[field] : null,
    ]),
  );
const compareTargets = (nutrition, targets, dayCount = 1) =>
  Object.fromEntries(
    Object.entries(targets).map(([key, dailyTarget]) => {
      const target = dailyTarget === null ? null : dailyTarget * dayCount;
      const consumed = nutrition[key] ?? 0;
      return [
        key,
        {
          consumed,
          target,
          remaining: target === null ? null : target - consumed,
          percentage: target === null ? null : Math.round((consumed / target) * 10000) / 100,
        },
      ];
    }),
  );
export function createDiaryService({
  diaryRepository: repo,
  services = {},
  clock = () => new Date(),
}) {
  const now = () => new Date(typeof clock === "function" ? clock() : clock.now());
  function range(query = {}) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: query.timezone ?? "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(now())
        .map((part) => [part.type, part.value]),
    );
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const to = query.date ?? query.to ?? today;
    const from =
      query.date ??
      query.from ??
      new Date(new Date(to).getTime() - 29 * 86400000).toISOString().slice(0, 10);
    if (from > to || new Date(to) - new Date(from) > 366 * 86400000)
      throw AppError.badRequest("Range must be ordered and at most 366 days");
    return {
      from,
      to,
      date: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T00:00:00Z`) },
    };
  }
  async function createForUser(userId, input, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const body = diaryInput.parse(input);
    let nutritionBasis, basisQuantity, basisUnit, nameSnapshot;
    if (body.sourceType === "recipe") {
      if (!services.recipes?.getById)
        throw AppError.serviceUnavailable("Recipe service is unavailable");
      const recipe = await services.recipes.getById(body.recipeId, {
        actor: { userId },
        session: options.session,
      });
      if (!recipe?.nutritionPerServing) throw AppError.notFound("Recipe nutrition not found");
      nameSnapshot = recipe.title;
      nutritionBasis = normalizeNutrition(recipe.nutritionPerServing);
      basisQuantity = 1;
      basisUnit = "serving";
    } else if (body.sourceType === "food") {
      if (!services.foodItems?.getById)
        throw AppError.serviceUnavailable("Food item service is unavailable");
      const food = await services.foodItems.getById(body.foodItemId, {
        actor: { userId },
        session: options.session,
      });
      if (!food?.nutritionPer100g || food.status === "inactive")
        throw AppError.notFound("Food nutrition not found");
      const grams = quantityToGrams(body.quantity, body.unit, {
        defaultServing: food.defaultServing,
      });
      if (grams === null)
        throw AppError.badRequest("Food serving requires an explicit gram equivalent");
      nameSnapshot = food.name;
      nutritionBasis = scaleNutrition(food.nutritionPer100g, grams / 100);
      basisQuantity = body.quantity;
      basisUnit = body.unit;
    } else {
      nameSnapshot = body.nameSnapshot;
      nutritionBasis = normalizeNutrition(body.nutritionSnapshot);
      basisQuantity = body.servings;
      basisUnit = "serving";
    }
    const amount = body.sourceType === "food" ? body.quantity : body.servings;
    const nutritionSnapshot = scaleNutrition(nutritionBasis, amount / basisQuantity);
    const entry = await repo.create(
      {
        ...body,
        userId,
        date: new Date(`${body.date}T00:00:00Z`),
        consumedAt: body.consumedAt ? new Date(body.consumedAt) : now(),
        nameSnapshot,
        nutritionSnapshot,
        nutritionBasis,
        basisQuantity,
        basisUnit,
        version: 0,
      },
      options,
    );
    return publicEntry(entry);
  }
  async function getOwned(userId, id, options = {}) {
    const entry = await repo.findOne(
      { _id: id, userId },
      { ...options, projection: "+nutritionBasis +basisQuantity +basisUnit" },
    );
    if (!entry) throw AppError.notFound("Diary entry not found");
    return entry;
  }
  const operations = {
    getDiaryEntries: async ({ actor, query = {} }) => {
      const { date } = range(query);
      const result = await repo.findMany(
        { userId: owner(actor), date },
        { page: query.page, limit: query.limit, sort: { date: -1, consumedAt: -1, _id: -1 } },
      );
      return { ...result, data: result.data.map(publicEntry) };
    },
    createDiaryEntry: async ({ actor, body }) => createForUser(owner(actor), body),
    updateDiaryEntry: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const entry = await getOwned(userId, params.id);
      const set = { ...body };
      if (entry.sourceType === "food" && "servings" in body)
        throw AppError.badRequest("Food entries use quantity, not servings");
      if (entry.sourceType !== "food" && ("quantity" in body || "unit" in body))
        throw AppError.badRequest("Recipe and custom entries use servings");
      if ("quantity" in body || "unit" in body || "servings" in body) {
        if (!entry.nutritionBasis || !entry.basisQuantity || !entry.basisUnit)
          throw AppError.conflict("Entry has no immutable nutrition basis");
        const quantity =
          entry.sourceType === "food"
            ? (body.quantity ?? entry.quantity)
            : (body.servings ?? entry.servings);
        const amount = convertQuantity(
          quantity,
          body.unit ?? entry.unit ?? "serving",
          entry.basisUnit,
        );
        if (amount === null)
          throw AppError.badRequest("Unit change is not compatible with the saved nutrition basis");
        set.nutritionSnapshot = scaleNutrition(entry.nutritionBasis, amount / entry.basisQuantity);
      }
      if (body.consumedAt) set.consumedAt = new Date(body.consumedAt);
      const updated = await repo.updateOne(
        {
          _id: params.id,
          userId,
          version: entry.version === undefined ? { $exists: false } : entry.version,
        },
        { $set: set, $inc: { version: 1 } },
      );
      if (!updated) throw AppError.conflict("Diary entry changed concurrently");
      return publicEntry(updated);
    },
    deleteDiaryEntry: async ({ actor, params }) => {
      const deleted = await repo.deleteOne({ _id: params.id, userId: owner(actor) });
      if (!deleted) throw AppError.notFound("Diary entry not found");
      return { id: String(deleted._id), deleted: true };
    },
    getDiarySummary: async ({ actor, query = {} }) => {
      const userId = owner(actor);
      const { from, to, date } = range(query);
      const sums = Object.fromEntries(
        NUTRIENT_KEYS.map((key) => [key, { $sum: `$nutritionSnapshot.${key}` }]),
      );
      const rows = await repo.aggregate([
        { $match: { userId: mongoId(userId), date } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
            entryCount: { $sum: 1 },
            ...sums,
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const days = rows.map((row) => ({
        date: row._id,
        entryCount: row.entryCount,
        nutrition: normalizeNutrition(row),
      }));
      const targets = dailyTargets(await services.users?.getNutrition?.(userId));
      const nutrition = sumNutrition(days.map((day) => day.nutrition));
      const dayCount = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
      return {
        from,
        to,
        days: days.map((day) => ({
          ...day,
          targetComparison: compareTargets(day.nutrition, targets),
        })),
        entryCount: days.reduce((sum, day) => sum + day.entryCount, 0),
        nutrition,
        dailyTargets: targets,
        targetComparison: compareTargets(nutrition, targets, dayCount),
      };
    },
  };
  return {
    operations,
    publicService: {
      createForUser,
      getSummary: async (userId, query) => operations.getDiarySummary({ actor: { userId }, query }),
    },
  };
}
