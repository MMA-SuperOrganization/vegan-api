import { randomUUID, createHash } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { pantryItemInput } from "./pantries.validation.js";
import { convertQuantity } from "../../common/utils/units.js";

export const ownerId = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
const paginate = (items, { page = 1, limit = 20 } = {}) => ({
  data: items.slice((page - 1) * limit, page * limit),
  meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
});
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;

export function createPantriesService({
  pantriesRepository: repo,
  services = {},
  clock = () => new Date(),
}) {
  const now = () => new Date(typeof clock === "function" ? clock() : clock.now());
  async function getForUser(userId, options = {}) {
    if (!userId) throw AppError.unauthorized();
    let pantry = await repo.findOne({ userId }, options);
    if (!pantry) {
      try {
        pantry = await repo.updateOne(
          { userId },
          { $setOnInsert: { userId, items: [], bulkRequests: [], version: 0 } },
          { ...options, upsert: true },
        );
      } catch (error) {
        // E11000 aborts a Mongo transaction; only the outer transaction may retry it.
        if (error.code !== 11000 || options.session) throw error;
        pantry = await repo.findOne({ userId }, options);
      }
    }
    return pantry;
  }
  async function mutate(userId, fn, options = {}) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const pantry = await getForUser(userId, options);
      const change = fn({
        ...pantry,
        items: (pantry.items ?? []).map((item) => ({ ...item })),
        bulkRequests: (pantry.bulkRequests ?? []).map((request) => ({ ...request })),
      });
      if (!change) return pantry;
      if (change.items.length > 500) throw AppError.badRequest("Pantry is limited to 500 items");
      const versionFilter = pantry.version === undefined ? { $exists: false } : pantry.version;
      const updated = await repo.updateOne(
        { _id: pantry._id, userId, version: versionFilter },
        { $set: change, $inc: { version: 1 } },
        options,
      );
      if (updated) return updated;
    }
    throw AppError.conflict("Pantry changed concurrently; retry your request");
  }
  async function addItems(userId, inputs, { session, idempotencyKey } = {}) {
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 100)
      throw AppError.badRequest("Supply between 1 and 100 pantry items");
    const sanitized = inputs.map((input) =>
      pantryItemInput.parse(
        Object.fromEntries(
          ["foodItemId", "quantity", "unit", "expiresAt", "note"]
            .filter((key) => input[key] !== undefined)
            .map((key) => [key, input[key]]),
        ),
      ),
    );
    const hash = createHash("sha256")
      .update(JSON.stringify(canonical(sanitized)))
      .digest("hex");
    if (idempotencyKey) {
      const pantry = await getForUser(userId, { session });
      const previous = (pantry.bulkRequests ?? []).find(
        (request) => request.key === idempotencyKey,
      );
      if (previous) {
        if (previous.hash !== hash)
          throw AppError.conflict("Idempotency key was used with a different payload");
        return pantry;
      }
    }
    // Resolve once outside the CAS retry loop; names are immutable snapshots.
    const items = [];
    for (const input of sanitized) {
      if (!services.foodItems?.getById)
        throw AppError.serviceUnavailable("Food item service is unavailable");
      const food = await services.foodItems.getById(input.foodItemId, {
        actor: { userId },
        session,
      });
      if (!food || food.status === "inactive") throw AppError.notFound("Food item not found");
      items.push({
        ...input,
        itemId: randomUUID(),
        foodNameSnapshot: food.name,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        addedAt: now(),
        updatedAt: now(),
      });
    }
    return mutate(
      userId,
      (pantry) => {
        const requests = pantry.bulkRequests ?? [];
        if (idempotencyKey) {
          const existing = requests.find((request) => request.key === idempotencyKey);
          if (existing) {
            if (existing.hash !== hash)
              throw AppError.conflict("Idempotency key was used with a different payload");
            return null;
          }
          if (requests.length >= 100)
            throw AppError.conflict("Pantry bulk idempotency capacity reached");
          requests.push({ key: idempotencyKey, hash });
        }
        return { items: [...(pantry.items ?? []), ...items], bulkRequests: requests };
      },
      { session },
    );
  }
  async function match(userId, recipes, options = {}) {
    const pantry = await getForUser(userId, options);
    const usable = (pantry.items ?? []).filter(
      (item) => !item.expiresAt || new Date(item.expiresAt) >= now(),
    );
    return recipes
      .map((recipe) => {
        const ingredients = (recipe.ingredients ?? []).filter((item) => !item.optional);
        const matched = ingredients.filter((ingredient) =>
          usable.some((item) => String(item.foodItemId) === String(ingredient.foodItemId)),
        );
        const missing = ingredients.filter((ingredient) => !matched.includes(ingredient));
        const sufficient = ingredients.filter(
          (ingredient) =>
            usable
              .filter((item) => String(item.foodItemId) === String(ingredient.foodItemId))
              .reduce(
                (sum, item) =>
                  sum + (convertQuantity(item.quantity, item.unit, ingredient.unit) ?? 0),
                0,
              ) >= ingredient.quantity,
        );
        return {
          recipe,
          matchRatio: ingredients.length ? matched.length / ingredients.length : 0,
          matchedCount: matched.length,
          sufficientCount: sufficient.length,
          missingIngredients: missing,
        };
      })
      .sort((a, b) => b.matchRatio - a.matchRatio || b.sufficientCount - a.sufficientCount);
  }
  const operations = {
    getPantry: async ({ actor }) => getForUser(ownerId(actor)),
    addPantryItem: async ({ actor, body }) => addItems(ownerId(actor), [body]),
    addPantryItemsBulk: async ({ actor, body }) =>
      addItems(ownerId(actor), body.items, { idempotencyKey: body.idempotencyKey }),
    updatePantryItem: async ({ actor, body, params }) =>
      mutate(ownerId(actor), (pantry) => {
        const item = pantry.items.find((item) => item.itemId === params.itemId);
        if (!item) throw AppError.notFound("Pantry item not found");
        Object.assign(item, body, { updatedAt: now() });
        if ("expiresAt" in body) item.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
        return { items: pantry.items };
      }),
    deletePantryItem: async ({ actor, params }) =>
      mutate(ownerId(actor), (pantry) => {
        if (!pantry.items.some((item) => item.itemId === params.itemId))
          throw AppError.notFound("Pantry item not found");
        return { items: pantry.items.filter((item) => item.itemId !== params.itemId) };
      }),
    getExpiringPantryItems: async ({ actor, query = {} }) => {
      const pantry = await getForUser(ownerId(actor));
      const start = now();
      const end = new Date(start.getTime() + (query.days ?? 7) * 86400000);
      return paginate(
        pantry.items
          .filter(
            (item) =>
              item.expiresAt &&
              new Date(item.expiresAt) <= end &&
              (query.includeExpired || new Date(item.expiresAt) >= start),
          )
          .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt)),
        query,
      );
    },
    getPantryRecipeSuggestions: async ({ actor, query = {} }) => {
      const userId = ownerId(actor);
      if (!services.recipes?.listPublic)
        throw AppError.serviceUnavailable("Recipe service is unavailable");
      const [profile, nutrition] = await Promise.all([
        services.users?.getProfile?.(userId),
        services.users?.getNutrition?.(userId),
      ]);
      const excludeAllergenIds = [
        ...new Set(
          [...(profile?.allergenIds ?? []), ...(nutrition?.allergenIds ?? [])].map(String),
        ),
      ];
      const results = await services.recipes.listPublic({
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(profile?.dietType ? { dietType: profile.dietType } : {}),
        ...(excludeAllergenIds.length ? { excludeAllergenIds } : {}),
      });
      const recipes = results.data ?? results;
      const foodIds = recipes
        .flatMap((recipe) => (recipe.ingredients ?? []).map((item) => item.foodItemId))
        .filter(Boolean);
      const unsafeIds = new Set(
        (await services.foodItems?.getUnsafeIds?.(foodIds, {
          allergenIds: excludeAllergenIds,
          dietType: profile?.dietType,
        })) ?? [],
      );
      const safeRecipes = recipes.filter(
        (recipe) =>
          !(recipe.ingredients ?? []).some((item) => unsafeIds.has(String(item.foodItemId))),
      );
      const data = (await match(userId, safeRecipes)).filter(
        (result) => result.matchRatio >= (query.minMatch ?? 0),
      );
      return {
        data,
        meta: {
          ...(results.meta ?? { page: 1, limit: 20, total: data.length, totalPages: 1 }),
          evaluated: (results.data ?? results).length,
        },
      };
    },
  };
  const safePantry = (pantry) => {
    const { bulkRequests, ...data } = pantry;
    return data;
  };
  for (const key of [
    "getPantry",
    "addPantryItem",
    "addPantryItemsBulk",
    "updatePantryItem",
    "deletePantryItem",
  ]) {
    const operation = operations[key];
    operations[key] = async (context) => safePantry(await operation(context));
  }
  return {
    operations,
    publicService: {
      getForUser: async (userId, options) => safePantry(await getForUser(userId, options)),
      addItems: async (userId, items, options) =>
        safePantry(await addItems(userId, items, options)),
      match,
    },
  };
}
