import { requireActor, transaction, safeContent } from "../../common/content-service.js";
import { hasSaveCounter } from "./saved-items.constants.js";
export const createSavedItemsService = (deps) => {
  const repo = deps.repositories.savedItems;
  const persistWithStandaloneFallback = async (work) => {
    try {
      return await transaction(deps, work);
    } catch (error) {
      if (error?.code !== "TRANSACTIONS_REQUIRED") throw error;
      // Bookmark identity is protected by a unique owner/target index. On a
      // standalone MongoDB we compensate a failed counter write so the user's
      // saved list remains retryable without exposing another account's data.
      return work(undefined);
    }
  };
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
      persistWithStandaloneFallback(async (session) => {
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
        let after;
        try {
          after = await repo.create(filter, { session });
        } catch (error) {
          if (error?.code !== 11000) throw error;
          return repo.findOne(filter, { session });
        }
        if (!hasSaveCounter(params.targetType)) return after;
        try {
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { saveCount: 1 },
            { session },
          );
          return after;
        } catch (error) {
          if (!session) await repo.deleteOne(filter);
          throw error;
        }
      }),
    unsaveItem: ({ actor, params }) =>
      persistWithStandaloneFallback(async (session) => {
        requireActor(actor);
        const filter = {
          userId: actor.userId,
          targetType: params.targetType,
          targetId: params.targetId,
        };
        const before = await repo.findOne(filter, { session });
        if (!before) return { removed: false };
        const deleted = await repo.deleteOne(filter, { session });
        if (!deleted) return { removed: false };
        if (!hasSaveCounter(params.targetType)) return { removed: true };
        try {
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { saveCount: -1 },
            { session },
          );
          return { removed: true };
        } catch (error) {
          if (!session) {
            try {
              await repo.create(filter);
            } catch (restoreError) {
              if (restoreError?.code !== 11000) throw restoreError;
            }
          }
          throw error;
        }
      }),
  };
  return {
    operations,
    service: {
      getMine: (userId, targetType, targetId) => repo.findOne({ userId, targetType, targetId }),
    },
  };
};
