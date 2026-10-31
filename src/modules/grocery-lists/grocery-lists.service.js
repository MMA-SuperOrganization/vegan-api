import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { groceryItemInput, groceryListInput } from "./grocery-lists.validation.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
export function createGroceryListsService({
  groceryListsRepository: repo,
  services = {},
  transaction,
}) {
  async function getOwned(userId, id, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const list = await repo.findOne({ _id: id, userId }, options);
    if (!list) throw AppError.notFound("Grocery list not found");
    return list;
  }
  async function makeItem(userId, input, options = {}) {
    const parsed = groceryItemInput.parse(input);
    let nameSnapshot = parsed.nameSnapshot;
    let categorySnapshot;
    const trustedSnapshot = Boolean(
      options.trustedMealPlanSnapshots && options.sourceMealPlanId && parsed.nameSnapshot,
    );
    // Only the internal plan-generation path may preserve verified historical names.
    // Manual HTTP creation always resolves the current master-data name. Generated
    // lists preserve the historical recipe name while still resolving its category.
    if (parsed.foodItemId) {
      if (!services.foodItems?.getById) {
        if (trustedSnapshot) {
          return { ...parsed, itemId: randomUUID(), nameSnapshot, checked: false };
        }
        throw AppError.serviceUnavailable("Food item service is unavailable");
      }
      const food = await services.foodItems.getById(parsed.foodItemId, {
        actor: { userId },
        session: options.session,
        allowInactive: trustedSnapshot,
      });
      if (!trustedSnapshot) {
        if (!food || food.status === "inactive") throw AppError.notFound("Food item not found");
        nameSnapshot = food.name;
      }
      if (typeof food.categorySnapshot === "string") categorySnapshot = food.categorySnapshot;
      else if (food.categoryId && services.categories?.getById) {
        const category = await services.categories.getById(food.categoryId, {
          session: options.session,
          allowInactive: trustedSnapshot,
        });
        categorySnapshot = category?.name;
      }
    } else if (parsed.personalIngredientId) {
      if (!services.personalIngredients?.getOwned)
        throw AppError.serviceUnavailable("Personal ingredient service is unavailable");
      const ingredient = await services.personalIngredients.getOwned(
        userId,
        parsed.personalIngredientId,
        { session: options.session },
      );
      if (ingredient.status !== "active") throw AppError.notFound("Personal ingredient not found");
      nameSnapshot = ingredient.name;
    }
    return { ...parsed, itemId: randomUUID(), nameSnapshot, categorySnapshot, checked: false };
  }
  async function createForUser(userId, input, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const parsed = groceryListInput.parse(input);
    if (options.sourceMealPlanId) {
      if (!services.mealPlans?.getOwned)
        throw AppError.serviceUnavailable("Meal plan service is unavailable");
      await services.mealPlans.getOwned(userId, options.sourceMealPlanId, options);
    }
    const items = [];
    for (const item of parsed.items) items.push(await makeItem(userId, item, options));
    return repo.create(
      {
        userId,
        name: parsed.name,
        items,
        status: "active",
        version: 0,
        ...(options.sourceMealPlanId ? { sourceMealPlanId: options.sourceMealPlanId } : {}),
      },
      { session: options.session },
    );
  }
  async function change(userId, id, fn, options = {}) {
    const list = await getOwned(userId, id, options);
    const set = fn({ ...list, items: list.items.map((item) => ({ ...item })) });
    if (!set) return list;
    if (set.items?.length > 500) throw AppError.badRequest("Grocery list is limited to 500 items");
    const updated = await repo.updateOne(
      { _id: id, userId, version: list.version === undefined ? { $exists: false } : list.version },
      { $set: set, $inc: { version: 1 } },
      options,
    );
    if (!updated) throw AppError.conflict("Grocery list changed concurrently; retry your request");
    return updated;
  }
  const operations = {
    getGroceryLists: async ({ actor, query = {} }) =>
      repo.findMany(
        { userId: owner(actor), ...(query.status ? { status: query.status } : {}) },
        { page: query.page, limit: query.limit, sort: { createdAt: -1, _id: -1 } },
      ),
    getGroceryList: async ({ actor, params }) => getOwned(owner(actor), params.id),
    createGroceryList: async ({ actor, body }) => createForUser(owner(actor), body),
    updateGroceryList: async ({ actor, params, body }) =>
      change(owner(actor), params.id, () => body),
    deleteGroceryList: async ({ actor, params }) =>
      change(owner(actor), params.id, () => ({ status: "archived" })),
    addGroceryItem: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const item = await makeItem(userId, body);
      return change(userId, params.id, (list) => {
        if (list.status === "archived") throw AppError.conflict("Archived lists cannot be edited");
        return { items: [...list.items, item] };
      });
    },
    updateGroceryItem: async ({ actor, params, body }) =>
      change(owner(actor), params.id, (list) => {
        if (list.status === "archived") throw AppError.conflict("Archived lists cannot be edited");
        const item = list.items.find((item) => item.itemId === params.itemId);
        if (!item) throw AppError.notFound("Grocery item not found");
        Object.assign(item, body);
        return { items: list.items };
      }),
    deleteGroceryItem: async ({ actor, params }) =>
      change(owner(actor), params.id, (list) => {
        if (!list.items.some((item) => item.itemId === params.itemId))
          throw AppError.notFound("Grocery item not found");
        return { items: list.items.filter((item) => item.itemId !== params.itemId) };
      }),
    clearCheckedGroceryItems: async ({ actor, params }) =>
      change(owner(actor), params.id, (list) =>
        list.items.some((item) => item.checked)
          ? { items: list.items.filter((item) => !item.checked) }
          : null,
      ),
    transferCheckedGroceryItemsToPantry: async ({ actor, params }) => {
      const userId = owner(actor);
      if (!transaction || !services.pantries?.addItems)
        throw AppError.serviceUnavailable("Pantry transfer is unavailable");
      return transaction(async (session) => {
        const list = await getOwned(userId, params.id, { session });
        if (list.status === "archived")
          throw AppError.conflict("Archived lists cannot be transferred");
        const checked = list.items.filter((item) => item.checked);
        const transferable = checked.filter((item) => item.foodItemId || item.personalIngredientId);
        if (!transferable.length)
          throw AppError.badRequest("No checked grocery items can be transferred to pantry");
        const pantry = await services.pantries.addItems(
          userId,
          transferable.map((item) => ({
            ...(item.foodItemId ? { foodItemId: item.foodItemId } : {}),
            ...(item.personalIngredientId
              ? { personalIngredientId: item.personalIngredientId }
              : {}),
            quantity: item.quantity,
            unit: item.unit,
            ...(item.note ? { note: item.note } : {}),
          })),
          {
            session,
            idempotencyKey: `grocery-transfer:${list._id}:${list.version ?? 0}`,
          },
        );
        const transferredIds = new Set(transferable.map((item) => item.itemId));
        const groceryList = await repo.updateOne(
          {
            _id: list._id,
            userId,
            version: list.version === undefined ? { $exists: false } : list.version,
          },
          {
            $set: { items: list.items.filter((item) => !transferredIds.has(item.itemId)) },
            $inc: { version: 1 },
          },
          { session },
        );
        if (!groceryList)
          throw AppError.conflict("Grocery list changed concurrently; retry your request");
        return {
          groceryList,
          pantry,
          transferredCount: transferable.length,
          skippedItems: checked
            .filter((item) => !transferredIds.has(item.itemId))
            .map((item) => ({ itemId: item.itemId, nameSnapshot: item.nameSnapshot })),
        };
      });
    },
  };
  return {
    operations,
    publicService: {
      createForUser,
      getOwned,
      addItem: async (userId, id, item) =>
        operations.addGroceryItem({ actor: { userId }, params: { id }, body: item }),
    },
  };
}
