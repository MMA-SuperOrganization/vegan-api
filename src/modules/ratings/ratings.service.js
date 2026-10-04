import mongoose from "mongoose";
import { requireActor, transaction, casUpdate } from "../../common/content-service.js";
export const createRatingsService = (deps) => {
  const repo = deps.repositories.ratings;
  const summary = async (targetType, targetId, actor) => {
    await deps.services.content.getTarget(targetType, targetId, { publicOnly: true });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0,
      count = 0;
    // One aggregate snapshot avoids five sequential counts observing different writes.
    // Mongoose does not cast aggregate filters; explicitly normalize the ObjectId here.
    const rows = await repo.aggregate([
      { $match: { targetType, targetId: new mongoose.Types.ObjectId(String(targetId)) } },
      { $group: { _id: "$score", count: { $sum: 1 } } },
    ]);
    for (const row of rows) {
      distribution[row._id] = row.count;
      count += row.count;
      sum += row._id * row.count;
    }
    const mine = actor?.userId
      ? await repo.findOne({ userId: actor.userId, targetType, targetId })
      : null;
    return {
      targetType,
      targetId,
      count,
      average: count ? sum / count : 0,
      distribution,
      myRating: mine ? { score: mine.score, review: mine.review ?? null } : null,
    };
  };
  const operations = {
    upsertRating: ({ actor, params, body }) =>
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
        const after = before
          ? await casUpdate(
              repo,
              before,
              { score: body.score, review: body.review ?? null },
              { session },
            )
          : await repo.create(
              { ...filter, score: body.score, review: body.review ?? null, version: 0 },
              { session },
            );
        await deps.services.content.adjustCounters(
          params.targetType,
          params.targetId,
          { ratingCount: before ? 0 : 1, ratingSum: body.score - (before?.score ?? 0) },
          { session },
        );
        return after;
      }),
    deleteRating: ({ actor, params }) =>
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
            { ratingCount: -1, ratingSum: -deleted.score },
            { session },
          );
        return { removed: Boolean(deleted) };
      }),
    getRatingSummary: async ({ actor, params }) =>
      summary(params.targetType, params.targetId, actor),
  };
  return {
    operations,
    service: {
      summary,
      getMine: (userId, targetType, targetId) => repo.findOne({ userId, targetType, targetId }),
    },
  };
};
