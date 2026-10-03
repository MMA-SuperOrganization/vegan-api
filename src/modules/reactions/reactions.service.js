import { requireActor, transaction, casUpdate } from "../recipes/content.service.js";
export const createReactionsService = (deps) => {
  const repo = deps.repositories.reactions;
  const operations = {
    upsertReaction: ({ actor, params, body }) =>
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
        if (before) {
          if (before.type === body.type) return before;
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { reactionCount: 0 },
            { session },
          );
          return casUpdate(repo, before, { type: body.type }, { session });
        }
        const after = await repo.create({ ...filter, type: body.type, version: 0 }, { session });
        await deps.services.content.adjustCounters(
          params.targetType,
          params.targetId,
          { reactionCount: 1 },
          { session },
        );
        return after;
      }),
    deleteReaction: ({ actor, params }) =>
      transaction(deps, async (session) => {
        requireActor(actor);
        const filter = {
          userId: actor.userId,
          targetType: params.targetType,
          targetId: params.targetId,
        };
        const deleted = await repo.deleteOne(filter, { session });
        // Removal is allowed even when moderation has hidden the target. It cannot modify
        // another user's reaction because the actor is included in the delete filter.
        if (deleted)
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { reactionCount: -1 },
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
