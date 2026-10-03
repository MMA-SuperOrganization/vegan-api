import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { groceryItemInput, groceryListInput } from "./grocery-lists.validation.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
export function createGroceryListsService({ groceryListsRepository: repo, services = {} }) {
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
    // Only the internal plan-generation path may preserve verified historical names.
    // Manual HTTP creation never passes this option and always resolves master data.
    if (
      parsed.foodItemId &&
      !(options.trustedMealPlanSnapshots && options.sourceMealPlanId && parsed.nameSnapshot)
    ) {
      if (!services.foodItems?.getById)
        throw AppError.serviceUnavailable("Food item service is unavailable");
      const food = await services.foodItems.getById(parsed.foodItemId, {
        actor: { userId },
        session: options.session,
      });
      if (!food || food.status === "inactive") throw AppError.notFound("Food item not found");
      nameSnapshot = food.name;
      categorySnapshot =
        typeof food.categorySnapshot === "string" ? food.categorySnapshot : undefined;
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
