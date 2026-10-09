import { requireActor, transaction, casUpdate } from "../../common/content-service.js";
export const createReactionsService = (deps) => {
  const repo = deps.repositories.reactions;
  const persistWithStandaloneFallback = async (work) => {
    try {
      return await transaction(deps, work);
    } catch (error) {
      if (error?.code !== "TRANSACTIONS_REQUIRED") throw error;
      return work(undefined);
    }
  };

  const updateReactionType = async (before, type, params, session) => {
    if (before.type === type) return before;
    // A zero delta fences the target inside a transaction and verifies that it
    // still exists before a standalone write changes only the reaction type.
    await deps.services.content.adjustCounters(
      params.targetType,
      params.targetId,
      { reactionCount: 0 },
      { session },
    );
    return casUpdate(repo, before, { type }, { session });
  };

  const operations = {
    upsertReaction: ({ actor, params, body }) =>
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
        if (before) return updateReactionType(before, body.type, params, session);

        let after;
        try {
          after = await repo.create({ ...filter, type: body.type, version: 0 }, { session });
        } catch (error) {
          // A duplicate aborts a Mongo transaction and must reach the outer retry.
          // Only recover in-place for standalone writes where no session exists.
          if (error?.code !== 11000 || session) throw error;
          const concurrent = await repo.findOne(filter, { session });
          if (!concurrent) throw error;
          return updateReactionType(concurrent, body.type, params, session);
        }
        try {
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { reactionCount: 1 },
            { session },
          );
          return after;
        } catch (error) {
          if (!session) await repo.deleteOne({ ...filter, _id: after._id });
          throw error;
        }
      }),
    deleteReaction: ({ actor, params }) =>
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
        // Removal is allowed even when moderation has hidden the target. It cannot modify
        // another user's reaction because the actor is included in the delete filter.
        try {
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { reactionCount: -1 },
            { session },
          );
          return { removed: true };
        } catch (error) {
          if (!session) {
            try {
              await repo.create({ ...filter, type: before.type, version: before.version ?? 0 });
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
