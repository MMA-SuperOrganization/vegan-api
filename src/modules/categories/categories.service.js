import { AppError } from "../../common/errors/app-error.js";
import { id } from "../../common/validators/domain.schemas.js";
import { requireFound, slug } from "../../common/domain.js";
export const createCategoriesService = ({ deps, repository }) => {
  const getById = async (value, options = {}) =>
    requireFound(
      await repository.findOne(
        { _id: id.parse(String(value)), ...(options.allowInactive ? {} : { status: "active" }) },
        options,
      ),
      "Category not found",
    );
  const getMany = async (values, options = {}) => {
    const ids = [...new Set(values.map(String))];
    if (!options.session) return Promise.all(ids.map((value) => getById(value, options)));
    const result = [];
    for (const value of ids) result.push(await getById(value, options));
    return result;
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
        targetType: "category",
        targetId: String(after._id),
        before,
        after,
        requestId: context.requestId,
        ipHash: context.ipHash,
        session,
      });
      return after;
    });
  };
  const unique = async (value, ignoreId, session) => {
    const existing = await repository.findOne({ slug: value }, { session });
    if (existing && String(existing._id) !== String(ignoreId))
      throw AppError.conflict("Category slug already exists");
  };
  return {
    operations: {
      getCategories: ({ query = {} }) =>
        repository.findMany(
          { status: "active", ...(query.type ? { type: query.type } : {}) },
          { page: query.page, limit: query.limit, sort: { sortOrder: 1, name: 1, _id: 1 } },
        ),
      createCategory: (context) =>
        mutate(context, "category.create", async (session) => {
          const data = {
            ...context.body,
            slug: context.body.slug ?? slug(context.body.name),
            status: context.body.status ?? "active",
            sortOrder: context.body.sortOrder ?? 0,
          };
          await unique(data.slug, null, session);
          return { before: null, after: await repository.create(data, { session }) };
        }),
      updateCategory: (context) =>
        mutate(context, "category.update", async (session) => {
          const before = await getById(context.params.id, { session, allowInactive: true });
          const data = { ...context.body };
          if (data.slug) await unique(data.slug, before._id, session);
          if (
            data.type &&
            data.type !== before.type &&
            deps.repositories.foodItems &&
            (await deps.repositories.foodItems.count({ categoryId: before._id }, { session }))
          )
            throw AppError.conflict("Cannot change type of a category referenced by food items");
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
      deleteCategory: (context) =>
        mutate(context, "category.inactivate", async (session) => {
          const before = await getById(context.params.id, { session, allowInactive: true });
          return {
            before,
            after: requireFound(
              await repository.updateOne(
                { _id: before._id },
                { $set: { status: "inactive" } },
                { session, new: true },
              ),
            ),
          };
        }),
    },
    services: { getById, getMany },
  };
};
