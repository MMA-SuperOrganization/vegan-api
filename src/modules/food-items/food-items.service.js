import { AppError } from "../../common/errors/app-error.js";
import { id } from "../../common/validators/domain.schemas.js";
import { requireFound, slug } from "../../common/domain.js";
import { dietFilter } from "../../common/utils/diet.js";
import { fuzzyMongoRegex } from "../../common/utils/fuzzy-search.js";
const publicFields = [
  "_id",
  "name",
  "slug",
  "aliases",
  "categoryId",
  "imageUrl",
  "defaultServing",
  "nutritionPer100g",
  "allergenIds",
  "isVegan",
  "isVegetarian",
  "containsEggs",
  "containsDairy",
  "status",
  "createdAt",
  "updatedAt",
];
const publicFood = (value) =>
  Object.fromEntries(
    publicFields.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]),
  );
export const createFoodItemsService = ({ deps, repository }) => {
  const getById = async (value, options = {}) =>
    requireFound(
      await repository.findOne(
        { _id: id.parse(String(value)), ...(options.allowInactive ? {} : { status: "active" }) },
        options,
      ),
      "Food item not found",
    );
  const getMany = async (values, options = {}) => {
    const ids = [...new Set(values.map(String))];
    if (!options.session) return Promise.all(ids.map((value) => getById(value, options)));
    const result = [];
    for (const value of ids) result.push(await getById(value, options));
    return result;
  };
  const getUnsafeIds = async (values, { allergenIds = [], dietType } = {}) => {
    const ids = [...new Set(values.map((value) => id.parse(String(value))))];
    const conditions = [];
    if (allergenIds.length) conditions.push({ allergenIds: { $in: allergenIds } });
    const diet = dietFilter(dietType);
    if (Object.keys(diet).length) conditions.push({ $nor: [diet] });
    if (!conditions.length) return [];
    const unsafe = [];
    for (let index = 0; index < ids.length; index += 100) {
      const result = await repository.findMany(
        { _id: { $in: ids.slice(index, index + 100) }, $or: conditions },
        { page: 1, limit: 100, projection: { _id: 1 } },
      );
      unsafe.push(...result.data.map((food) => String(food._id)));
    }
    return unsafe;
  };
  const references = async (data, session) => {
    if (data.categoryId) {
      if (!deps.services?.categories?.getById)
        throw AppError.serviceUnavailable("Category service unavailable");
      const category = await deps.services.categories.getById(data.categoryId, { session });
      if (category.type !== "food") throw AppError.badRequest("Food items require a food category");
    }
    if (data.allergenIds?.length) {
      if (!deps.services?.allergens?.getMany)
        throw AppError.serviceUnavailable("Allergen service unavailable");
      await deps.services.allergens.getMany(data.allergenIds, { session });
    }
  };
  const unique = async (value, ignoreId, session) => {
    const existing = await repository.findOne({ slug: value }, { session });
    if (existing && String(existing._id) !== String(ignoreId))
      throw AppError.conflict("Food item slug already exists");
  };
  const mutate = async (context, action, work) => {
    if (!context.actor?.userId) throw AppError.unauthorized();
    if (context.actor.role !== "admin" || context.actor.status !== "active")
      throw AppError.forbidden();
    if (!deps.transaction || !deps.audit?.record)
      throw AppError.serviceUnavailable("Transaction and audit support are required");
    return deps.transaction(async (session) => {
      if (deps.services?.users?.getById) {
        const admin = await deps.services.users.getById(context.actor.userId, { session });
        if (admin.role !== "admin") throw AppError.forbidden();
      }
      const { before, after } = await work(session);
      await deps.audit.record({
        actor: context.actor,
        action,
        targetType: "foodItem",
        targetId: String(after._id),
        before,
        after,
        requestId: context.requestId,
        ipHash: context.ipHash,
        session,
      });
      return publicFood(after);
    });
  };
  return {
    operations: {
      async searchFoodItems({ query = {} }) {
        const filter = { status: "active" };
        if (query.q)
          filter.$or = ["name", "normalizedName", "aliases"].map((key) => ({
            [key]: fuzzyMongoRegex(query.q),
          }));
        if (query.categoryId ?? query.category)
          filter.categoryId = query.categoryId ?? query.category;
        const exclude = [
          ...new Set([...(query.excludeAllergenIds ?? []), ...(query.allergenExclusion ?? [])]),
        ];
        if (exclude.length) filter.allergenIds = { $nin: exclude };
        if (query.isVegan !== undefined) filter.isVegan = query.isVegan;
        if (query.isVegetarian !== undefined) filter.isVegetarian = query.isVegetarian;
        const sorts = {
          name: { normalizedName: 1, _id: 1 },
          "-name": { normalizedName: -1, _id: -1 },
          createdAt: { createdAt: 1, _id: 1 },
          "-createdAt": { createdAt: -1, _id: -1 },
          calories: { "nutritionPer100g.caloriesKcal": 1, _id: 1 },
          "-calories": { "nutritionPer100g.caloriesKcal": -1, _id: -1 },
        };
        const result = await repository.findMany(filter, {
          page: query.page,
          limit: query.limit,
          sort: sorts[query.sort ?? "name"],
        });
        return { ...result, data: result.data.map(publicFood) };
      },
      async getFoodItem({ params }) {
        return publicFood(await getById(params.id));
      },
      createFoodItem: (context) =>
        mutate(context, "foodItem.create", async (session) => {
          const data = {
            ...context.body,
            normalizedName: context.body.name.normalize("NFKC").toLowerCase(),
            slug: context.body.slug ?? slug(context.body.name),
            aliases: context.body.aliases ?? [],
            allergenIds: context.body.allergenIds ?? [],
            status: context.body.status ?? "active",
            createdBy: context.actor.userId,
            updatedBy: context.actor.userId,
          };
          await references(data, session);
          await unique(data.slug, null, session);
          return { before: null, after: await repository.create(data, { session }) };
        }),
      updateFoodItem: (context) =>
        mutate(context, "foodItem.update", async (session) => {
          const before = await getById(context.params.id, { session, allowInactive: true });
          const data = { ...context.body, updatedBy: context.actor.userId };
          if (data.name) data.normalizedName = data.name.normalize("NFKC").toLowerCase();
          if ((data.isVegan ?? before.isVegan) && !(data.isVegetarian ?? before.isVegetarian))
            throw AppError.badRequest("A vegan food must also be vegetarian");
          const candidate = { ...before, ...data };
          if (candidate.isVegan && (candidate.containsEggs || candidate.containsDairy))
            throw AppError.badRequest("Vegan foods cannot contain eggs or dairy");
          await references(data, session);
          if (data.slug) await unique(data.slug, before._id, session);
          return {
            before,
            after: requireFound(
              await repository.updateOne(
                { _id: before._id },
                { $set: data },
                { session, new: true },
              ),
            ),
          };
        }),
      deleteFoodItem: (context) =>
        mutate(context, "foodItem.inactivate", async (session) => {
          const before = await getById(context.params.id, { session, allowInactive: true });
          return {
            before,
            after: requireFound(
              await repository.updateOne(
                { _id: before._id },
                { $set: { status: "inactive", updatedBy: context.actor.userId } },
                { session, new: true },
              ),
            ),
          };
        }),
    },
    services: { getById, getMany, getUnsafeIds },
  };
};
