import { requireActor, transaction, casUpdate } from "../../common/content-service.js";
import { NOTIFICATION_TYPES } from "../../common/constants/enums/notification.enums.js";
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
    upsertReaction: async ({ actor, params, body }) => {
      const result = await persistWithStandaloneFallback(async (session) => {
        requireActor(actor);
        const target = await deps.services.content.getTarget(params.targetType, params.targetId, {
          publicOnly: true,
          session,
        });
        const filter = {
          userId: actor.userId,
          targetType: params.targetType,
          targetId: params.targetId,
        };
        const before = await repo.findOne(filter, { session });
        if (before)
          return {
            reaction: await updateReactionType(before, body.type, params, session),
            created: false,
          };

        let after;
        const coordinated = Boolean(session || deps.standalone);
        try {
          after = await repo.create({ ...filter, type: body.type, version: 0 }, { session });
        } catch (error) {
          // A duplicate aborts a Mongo transaction and must reach the outer retry.
          // Only recover in-place for uncoordinated writes where no transaction exists.
          if (error?.code !== 11000 || coordinated) throw error;
          const concurrent = await repo.findOne(filter, { session });
          if (!concurrent) throw error;
          return {
            reaction: await updateReactionType(concurrent, body.type, params, session),
            created: false,
          };
        }
        try {
          await deps.services.content.adjustCounters(
            params.targetType,
            params.targetId,
            { reactionCount: 1 },
            { session },
          );
          return { reaction: after, created: true, recipientId: target.authorId, target };
        } catch (error) {
          if (!coordinated) await repo.deleteOne({ ...filter, _id: after._id });
          throw error;
        }
      });
      if (result.created)
        await deps.services.notifications?.deliverActivity?.({
          recipientId: result.recipientId,
          actorId: actor.userId,
          type: NOTIFICATION_TYPES.REACTION_CREATED,
          targetType:
            params.targetType === "comment" ? result.target.targetType : params.targetType,
          targetId: params.targetType === "comment" ? result.target.targetId : params.targetId,
          subjectType: params.targetType,
          reactionType: body.type,
          deliveryKey: `reaction:${result.reaction._id}:created`,
        });
      return result.reaction;
    },
    deleteReaction: ({ actor, params }) =>
      persistWithStandaloneFallback(async (session) => {
        requireActor(actor);
        const coordinated = Boolean(session || deps.standalone);
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
          if (!coordinated) {
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
