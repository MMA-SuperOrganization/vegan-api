import { requireActor, transaction, safeContent } from "../../common/content-service.js";
export const createSavedItemsService = (deps) => {
  const repo = deps.repositories.savedItems;
  const operations = {
    getSavedItems: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await repo.findMany(
        { userId: actor.userId, ...(query.targetType ? { targetType: query.targetType } : {}) },
        { page: query.page ?? 1, limit: query.limit ?? 20, sort: { createdAt: -1, _id: -1 } },
      );
      // Keep tombstones in the private saved list without leaking hidden/private content.
      const data = await Promise.all(
        result.data.map(async (item) => {
          try {
            return {
              ...item,
              target: safeContent(
                await deps.services.content.getTarget(item.targetType, item.targetId, {
                  publicOnly: true,
                }),
              ),
            };
          } catch (error) {
            if (error.statusCode !== 404) throw error;
            return { ...item, target: null, unavailable: true };
          }
        }),
      );
      return { ...result, data };
    },
    saveItem: ({ actor, params }) =>
      transaction(deps, async (session) => {
        requireActor(actor);
        await deps.services.content.getTarget(params.targetType, params.targetId, {
          publicOnly: true,
          session,
        });
        const filter = {
          userId: actor.userId,
          targetType: params.targetType,
          targetId: params.targetId,
        };
        const before = await repo.findOne(filter, { session });
        if (before) return before;
        const after = await repo.create(filter, { session });
        await deps.services.content.adjustCounters(
          params.targetType,
          params.targetId,
          { saveCount: 1 },
          { session },
        );
        return after;
      }),
    unsaveItem: ({ actor, params }) =>
      transaction(deps, async (session) => {
        requireActor(actor);
        const deleted = await repo.deleteOne(
          { userId: actor.userId, targetType: params.targetType, targetId: params.targetId },
          { session },
        );
        if (deleted)
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { saveCount: -1 },
            { session },
          );
        return { removed: Boolean(deleted) };
      }),
  };
  return {
    operations,
    service: {
      getMine: (userId, targetType, targetId) => repo.findOne({ userId, targetType, targetId }),
    },
  };
};
