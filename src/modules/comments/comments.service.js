import { AppError } from "../../common/errors/app-error.js";
import { assertOwner, requireFound, objectIdString } from "../../common/domain.js";
import {
  requireActor,
  transaction,
  auditAdmin,
  casUpdate,
  now,
} from "../recipes/content.service.js";
export const createCommentsService = (deps) => {
  const repo = deps.repositories.comments;
  const operations = {
    getComments: async ({ query }) => {
      await deps.services.content.getTarget(query.targetType, query.targetId, { publicOnly: true });
      if (query.parentCommentId) {
        const parent = await deps.services.content.getTarget("comment", query.parentCommentId, {
          publicOnly: true,
        });
        if (
          parent.parentCommentId ||
          parent.targetType !== query.targetType ||
          objectIdString(parent.targetId) !== query.targetId
        )
          throw AppError.badRequest("Invalid reply parent");
      }
      return repo.findMany(
        {
          targetType: query.targetType,
          targetId: query.targetId,
          status: "visible",
          deletedAt: null,
          parentCommentId: query.parentCommentId ?? null,
        },
        {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          sort: {
            createdAt: query.sort === "oldest" ? 1 : -1,
            _id: query.sort === "oldest" ? 1 : -1,
          },
        },
      );
    },
    createComment: (context) =>
      transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        await deps.services.content.getTarget(body.targetType, body.targetId, {
          publicOnly: true,
          session,
        });
        if (body.parentCommentId) {
          const parent = requireFound(await repo.findById(body.parentCommentId, { session }));
          if (
            parent.status !== "visible" ||
            parent.deletedAt ||
            parent.parentCommentId ||
            parent.targetType !== body.targetType ||
            objectIdString(parent.targetId) !== objectIdString(body.targetId)
          )
            throw AppError.badRequest(
              "Replies must reference a visible root comment on the same target",
            );
          await casUpdate(repo, parent, {}, { session });
        }
        const comment = await repo.create(
          {
            ...body,
            authorId: actor.userId,
            parentCommentId: body.parentCommentId ?? null,
            status: "visible",
            deletedAt: null,
            version: 0,
            reactionCount: 0,
          },
          { session },
        );
        await deps.services.content.adjustCounters(
          body.targetType,
          body.targetId,
          { commentCount: 1 },
          { session },
        );
        await auditAdmin(deps, context, "comment", null, comment, "comment.create", session);
        return comment;
      }),
    updateComment: (context) =>
      transaction(deps, async (session) => {
        const { actor, params, body } = context;
        requireActor(actor);
        const before = requireFound(await repo.findById(params.id, { session }));
        assertOwner(before, actor, { field: "authorId" });
        if (before.status !== "visible" || before.deletedAt)
          throw AppError.conflict("Only visible comments can be edited");
        await deps.services.content.getTarget("comment", before._id, { publicOnly: true, session });
        await deps.services.content.adjustCounters(
          before.targetType,
          before.targetId,
          { commentCount: 0 },
          { session },
        );
        const after = await casUpdate(
          repo,
          before,
          { content: body.content },
          { version: body.version, session },
        );
        await auditAdmin(deps, context, "comment", before, after, "comment.update", session);
        return after;
      }),
    deleteComment: (context) =>
      transaction(deps, async (session) => {
        const { actor, params } = context;
        requireActor(actor);
        const before = requireFound(await repo.findById(params.id, { session }));
        assertOwner(before, actor, { field: "authorId", allowAdmin: true });
        if (before.status === "deleted") return { _id: before._id, status: "deleted" };
        let visible = before.status === "visible" ? 1 : 0;
        // Replies have only one level; cascade them in bounded batches so a deleted root cannot
        // strand publicly visible children or leave the target's comment counter inflated.
        if (!before.parentCommentId) {
          for (;;) {
            const children = await repo.findMany(
              { parentCommentId: before._id, status: { $ne: "deleted" } },
              { limit: 100, session },
            );
            if (!children.data.length) break;
            for (const child of children.data) {
              if (child.status === "visible") visible++;
              await casUpdate(
                repo,
                child,
                { status: "deleted", deletedAt: now(deps) },
                { session },
              );
            }
          }
        }
        const after = await casUpdate(
          repo,
          before,
          { status: "deleted", deletedAt: now(deps) },
          { session },
        );
        if (visible)
          await deps.services.content.adjustCounters(
            before.targetType,
            before.targetId,
            { commentCount: -visible },
            { session },
          );
        await auditAdmin(deps, context, "comment", before, after, "comment.delete", session);
        return { _id: after._id, status: "deleted" };
      }),
  };
  return {
    operations,
    service: { getById: (id, options) => deps.services.content.getTarget("comment", id, options) },
  };
};
