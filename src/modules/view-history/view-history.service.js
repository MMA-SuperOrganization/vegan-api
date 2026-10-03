import { createHash } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import {
  requireActor,
  transaction,
  casUpdate,
  now,
  safeContent,
} from "../recipes/content.service.js";
export const createViewHistoryService = (deps) => {
  const repo = deps.repositories.viewHistories;
  const record = async (actor, targetType, targetId, progress) =>
    transaction(deps, async (session) => {
      requireActor(actor);
      const target = await deps.services.content.getTarget(targetType, targetId, {
        publicOnly: true,
        session,
      });
      if (
        progress &&
        (progress.progressSeconds > target.durationSeconds || progress.progressSeconds < 0)
      )
        throw AppError.badRequest("Progress must be inside the video's duration");
      if (progress?.completed === true && progress.progressSeconds < target.durationSeconds * 0.9)
        throw AppError.badRequest("Completion requires at least 90 percent watched");
      const time = now(deps);
      const windowMs = Math.max(60000, deps.env?.VIEW_DEDUP_WINDOW_MS ?? 30 * 60000);
      // Store bounded, hashed anti-spam receipts on the target, not in owner history. Clearing
      // history really deletes private records and cannot reset the public-view dedup rule.
      const key = createHash("sha256")
        .update(`view:${actor.userId}:${targetType}:${targetId}`)
        .digest("hex");
      const recent = (target.viewReceipts ?? []).filter(
        (receipt) => time - new Date(receipt.at) < windowMs,
      );
      // Saturation fails closed: never evict an unexpired receipt and let an old viewer
      // repeatedly inflate the counter by cycling through a full receipt window.
      const counted = recent.length < 10000 && !recent.some((receipt) => receipt.key === key);
      const targetRepo =
        deps.repositories[{ recipe: "recipes", post: "posts", video: "videos" }[targetType]];
      await casUpdate(
        targetRepo,
        target,
        {
          viewReceipts: counted ? [...recent, { key, at: time }].slice(-10000) : recent,
          ...(counted ? { viewCount: (target.viewCount ?? 0) + 1 } : {}),
        },
        { session },
      );
      const filter = { userId: actor.userId, targetType, targetId };
      const before = await repo.findOne(filter, { session });
      const changes = {
        lastViewedAt: time,
        ...(counted ? { lastCountedAt: time } : {}),
        viewCount: (before?.viewCount ?? 0) + (counted ? 1 : 0),
      };
      if (progress) {
        changes.progressSeconds = progress.progressSeconds;
        changes.completed = progress.progressSeconds >= target.durationSeconds * 0.9;
        changes.lastProgressAt = time;
      }
      const after = before
        ? await casUpdate(repo, before, changes, { session })
        : await repo.create(
            {
              ...filter,
              ...changes,
              progressSeconds: progress?.progressSeconds ?? 0,
              completed: changes.completed ?? false,
              version: 0,
            },
            { session },
          );
      return { ...after, counted };
    });
  const operations = {
    getViewHistory: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await repo.findMany(
        { userId: actor.userId, ...(query.targetType ? { targetType: query.targetType } : {}) },
        { page: query.page ?? 1, limit: query.limit ?? 20, sort: { lastViewedAt: -1, _id: -1 } },
      );
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
    clearViewHistory: ({ actor }) =>
      transaction(deps, async (session) => {
        requireActor(actor);
        let removed = 0;
        for (;;) {
          const items = await repo.findMany({ userId: actor.userId }, { limit: 100, session });
          if (!items.data.length) break;
          for (const item of items.data)
            if (await repo.deleteOne({ _id: item._id, userId: actor.userId }, { session }))
              removed++;
        }
        return { removed };
      }),
    deleteViewHistoryItem: ({ actor, params }) =>
      transaction(deps, async (session) => {
        requireActor(actor);
        const deleted = await repo.deleteOne(
          { userId: actor.userId, targetType: params.targetType, targetId: params.targetId },
          { session },
        );
        return { removed: Boolean(deleted) };
      }),
    recordView: async ({ actor, params }) => record(actor, params.targetType, params.targetId),
  };
  return {
    operations,
    service: {
      recordView: record,
      updateProgress: (actor, id, body) => record(actor, "video", id, body),
      getMine: (userId, targetType, targetId) => repo.findOne({ userId, targetType, targetId }),
    },
  };
};
