import { AppError } from "./errors/app-error.js";
import {
  assertOwner,
  objectIdString,
  publicFilter,
  requireFound,
  escapeRegex,
  redact,
} from "./domain.js";

export const requireActor = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  if (actor.status && actor.status !== "active") throw AppError.forbidden("Account is not active");
  return actor;
};
export const requireAdmin = (actor) => {
  requireActor(actor);
  if (actor.role !== "admin") throw AppError.forbidden();
  return actor;
};
export const now = (deps) =>
  new Date(typeof deps.clock === "function" ? deps.clock() : (deps.clock?.now?.() ?? Date.now()));
export const transaction = async (deps, work, session) => {
  if (session) return work(session);
  if (!deps.transaction)
    throw AppError.serviceUnavailable(
      "This operation requires transactions",
      "TRANSACTIONS_REQUIRED",
    );
  // Concurrent first inserts may race on a unique polymorphic key. Retry the whole transaction,
  // never continue an aborted MongoDB session after E11000.
  for (let attempt = 0; ; attempt++) {
    try {
      return await deps.transaction(work);
    } catch (error) {
      if (error.code !== 11000 || attempt >= 2) throw error;
    }
  }
};
export const auditAdmin = async (deps, context, targetType, before, after, action, session) => {
  if (context.actor?.role !== "admin") return;
  const audit = deps.audit ?? deps.services?.audit;
  if (!audit?.record) throw AppError.serviceUnavailable("Audit service is unavailable");
  await audit.record({
    actor: context.actor,
    actorId: context.actor.userId,
    actorRole: "admin",
    action,
    targetType,
    targetId: objectIdString(after?._id ?? before?._id),
    before: redact(before),
    after: redact(after),
    requestId: context.requestId,
    ipHash: context.ipHash,
    session,
  });
};
export const casFilter = (document) => ({
  _id: document._id,
  ...(document.version == null
    ? { $or: [{ version: { $exists: false } }, { version: 0 }] }
    : { version: document.version }),
});
export const casUpdate = async (repo, document, changes, { version, session } = {}) => {
  if (version != null && version !== (document.version ?? 0))
    throw AppError.conflict("Content changed; reload before editing", [], "VERSION_CONFLICT");
  const result = await repo.updateOne(
    casFilter(document),
    { $set: changes, $inc: { version: 1 } },
    { session },
  );
  if (!result)
    throw AppError.conflict("Content changed; reload before editing", [], "VERSION_CONFLICT");
  return result;
};
export const isPublic = (resource) =>
  resource?.status === "published" && resource.visibility === "public" && !resource.deletedAt;
export const safeContent = (resource, { actor } = {}) => {
  const { ratingSum, rejectionReason, viewReceipts, ...output } = resource;
  if (
    actor?.role === "admin" ||
    objectIdString(resource.authorId) === objectIdString(actor?.userId)
  )
    output.rejectionReason = rejectionReason;
  return output;
};
export const getReadable = async (
  repo,
  id,
  { actor, publicOnly = false, session, slug = false } = {},
) => {
  const filter = slug && !/^[a-f\d]{24}$/i.test(String(id)) ? { slug: id } : { _id: id };
  const resource = requireFound(await repo.findOne(filter, { session }));
  if (resource.deletedAt || resource.status === "deleted") throw AppError.notFound();
  if (
    !isPublic(resource) &&
    (publicOnly ||
      !actor ||
      (actor.role !== "admin" &&
        objectIdString(resource.authorId) !== objectIdString(actor.userId)))
  )
    throw AppError.notFound();
  return resource;
};
export const assertEditable = (resource, actor) => {
  requireActor(actor);
  assertOwner(resource, actor, { field: "authorId", allowAdmin: true });
  if (resource.deletedAt || resource.status === "deleted") throw AppError.notFound();
  if (actor.role !== "admin" && !["draft", "rejected"].includes(resource.status))
    throw AppError.conflict("Only draft or rejected content can be edited");
  if (actor.role === "admin" && ["hidden", "processing"].includes(resource.status))
    throw AppError.conflict("Content cannot be edited in this state");
};
export const listFilter = (query = {}) => {
  const filter = {};
  if (query.q) {
    const regex = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$or = [{ title: regex }, { description: regex }, { summary: regex }];
  }
  if (query.category ?? query.categoryId) filter.categoryIds = query.category ?? query.categoryId;
  if (query.tags?.length) filter.tags = { $all: query.tags };
  if (query.difficulty) filter.difficulty = query.difficulty;
  return filter;
};
export const listOptions = (query = {}) => ({
  page: query.page ?? 1,
  limit: query.limit ?? 20,
  sort: {
    oldest: { publishedAt: 1, _id: 1 },
    popular: { viewCount: -1, publishedAt: -1, _id: -1 },
    rating: { ratingAverage: -1, ratingCount: -1, _id: -1 },
    quickest: { totalMinutes: 1, _id: 1 },
  }[query.sort] ?? { publishedAt: -1, _id: -1 },
  projection: { ratingSum: 0, rejectionReason: 0, viewReceipts: 0 },
});
export const mediaIdsFor = (type, resource) => [
  ...new Set(
    (type === "recipe"
      ? [
          resource.coverMediaId,
          ...(resource.mediaIds ?? []),
          ...(resource.steps ?? []).map((s) => s.mediaId),
        ]
      : type === "video"
        ? [resource.videoMediaId, resource.thumbnailMediaId]
        : (resource.mediaIds ?? [])
    )
      .filter(Boolean)
      .map(objectIdString),
  ),
];
export const syncMedia = async (deps, type, before, after, actor, session) => {
  const previous = mediaIdsFor(type, before ?? {});
  const next = mediaIdsFor(type, after ?? {});
  const media = deps.services?.media;
  if (next.length && !media) throw AppError.serviceUnavailable("Media service is unavailable");
  for (const id of next) {
    const kind =
      type === "video"
        ? id === objectIdString(after.videoMediaId)
          ? "video"
          : "image"
        : undefined;
    const purpose =
      type === "video"
        ? kind === "video"
          ? ["video", "other"]
          : ["video_thumbnail", "video", "other"]
        : type === "recipe"
          ? ["recipe", "recipe_step", "other"]
          : ["post", "other"];
    await media.assertReady([id], { actor, ownerId: after.authorId, kind, purpose, session });
  }
  for (const id of next.filter((id) => !previous.includes(id)))
    await media.link(id, type, after._id, { actor, session });
  for (const id of previous.filter((id) => !next.includes(id)))
    await media.unlink(id, type, before._id, { actor, session });
};
export const lifecycle = async (deps, repo, type, context, action, validate) =>
  transaction(deps, async (session) => {
    const { actor, params, body = {} } = context;
    requireActor(actor);
    const existing = requireFound(await repo.findById(params.id, { session }));
    if (existing.deletedAt || existing.status === "deleted") throw AppError.notFound();
    if (action === "publish" || action === "reject") requireAdmin(actor);
    else assertOwner(existing, actor, { field: "authorId", allowAdmin: action === "delete" });
    let changes;
    if (action === "submit") {
      if (!["draft", "rejected"].includes(existing.status))
        throw AppError.conflict("Only drafts or rejected content can be submitted");
      if (existing.visibility === "private")
        throw AppError.conflict("Private content cannot be submitted");
      await validate(existing, actor, session);
      changes = { status: "pending_review", rejectionReason: null };
    } else if (action === "publish") {
      if (!["pending_review", "draft"].includes(existing.status))
        throw AppError.conflict("Content is not ready for publication");
      if (existing.visibility === "private")
        throw AppError.conflict("Private content cannot be published");
      await validate(existing, actor, session);
      changes = { status: "published", publishedAt: now(deps), rejectionReason: null };
    } else if (action === "reject") {
      if (existing.status !== "pending_review")
        throw AppError.conflict("Only pending content can be rejected");
      if (!body.reason?.trim()) throw AppError.badRequest("A rejection reason is required");
      changes = { status: "rejected", rejectionReason: body.reason };
    } else if (action === "delete") {
      changes = { status: "deleted", deletedAt: now(deps) };
      await syncMedia(deps, type, existing, null, actor, session);
    }
    const result = await casUpdate(repo, existing, changes, { version: body.version, session });
    await auditAdmin(deps, context, type, existing, result, `${type}.${action}`, session);
    return safeContent(result, { actor });
  });
export const userState = async (deps, type, id, actor) => {
  if (!actor?.userId) return {};
  const filter = { userId: actor.userId, targetType: type, targetId: id };
  const [saved, reaction, rating, history] = await Promise.all([
    deps.repositories.savedItems?.findOne(filter),
    deps.repositories.reactions?.findOne(filter),
    ["recipe", "video"].includes(type) ? deps.repositories.ratings?.findOne(filter) : null,
    deps.repositories.viewHistories?.findOne(filter),
  ]);
  return {
    saved: Boolean(saved),
    reacted: reaction?.type ?? null,
    rating: rating ? { score: rating.score, review: rating.review } : null,
    ...(type === "video"
      ? {
          progress: history
            ? {
                progressSeconds: history.progressSeconds ?? 0,
                completed: history.completed ?? false,
                lastProgressAt: history.lastProgressAt ?? null,
              }
            : null,
        }
      : {}),
  };
};

export const createContentFacade = (deps) => {
  const repoFor = (type) =>
    deps.repositories[
      { recipe: "recipes", post: "posts", video: "videos", comment: "comments" }[type]
    ];
  const getTarget = async (type, id, options = {}) => {
    if (typeof type === "object") {
      const arg = type;
      return getTarget(arg.targetType, arg.targetId, arg);
    }
    const repo = repoFor(type);
    if (!repo) throw AppError.badRequest("Unsupported content target");
    if (type !== "comment") return getReadable(repo, id, { publicOnly: true, ...options });
    const comment = requireFound(await repo.findById(id, { session: options.session }));
    if (comment.status === "deleted" || comment.deletedAt) throw AppError.notFound();
    if (options.actor?.role === "admin" && options.publicOnly === false) return comment;
    if (comment.status !== "visible") throw AppError.notFound();
    if (comment.parentCommentId) {
      const parent = await repo.findById(comment.parentCommentId, { session: options.session });
      if (!parent || parent.status !== "visible" || parent.deletedAt) throw AppError.notFound();
      if (options.session) await casUpdate(repo, parent, {}, { session: options.session });
    }
    const target = await getTarget(comment.targetType, comment.targetId, options);
    // A transaction reacting to a comment must fence both its root reply parent and
    // underlying content, otherwise a concurrent hide can commit against a stale read.
    if (options.session)
      await casUpdate(repoFor(comment.targetType), target, {}, { session: options.session });
    return comment;
  };
  const adjustCounters = async (type, id, deltas, { session } = {}) => {
    const repo = repoFor(type);
    const target = requireFound(await repo.findById(id, { session }));
    const changes = {};
    for (const [key, delta] of Object.entries(deltas)) {
      if (
        ![
          "viewCount",
          "commentCount",
          "reactionCount",
          "saveCount",
          "ratingCount",
          "ratingSum",
        ].includes(key) ||
        !Number.isFinite(delta)
      )
        throw AppError.badRequest("Invalid counter update");
      changes[key] = (target[key] ?? 0) + delta;
      if (changes[key] < 0)
        throw AppError.conflict("Content counter requires reconciliation", [], "COUNTER_CONFLICT");
    }
    if (deltas.ratingCount != null || deltas.ratingSum != null) {
      const count = changes.ratingCount ?? target.ratingCount ?? 0;
      const sum = changes.ratingSum ?? target.ratingSum ?? 0;
      changes.ratingAverage = count ? sum / count : 0;
    }
    return casUpdate(repo, target, changes, { session });
  };
  const setVisibility = async (type, id, options = {}) => {
    if (typeof type === "object") {
      const arg = type;
      return setVisibility(arg.targetType, arg.targetId, arg);
    }
    return transaction(
      deps,
      async (session) => {
        requireAdmin(options.actor);
        const repo = repoFor(type);
        if (!repo) throw AppError.badRequest("Unsupported content target");
        const before = requireFound(await repo.findById(id, { session }));
        if (before.deletedAt || before.status === "deleted") throw AppError.notFound();
        const visible = type === "comment" ? "visible" : "published";
        if (options.hidden && before.status !== visible)
          throw AppError.conflict("Only visible published content can be hidden");
        if (!options.hidden && before.status !== "hidden")
          throw AppError.conflict("Only hidden content can be restored");
        if (!options.hidden && type !== "comment") {
          const domain = deps.services[`${type}s`];
          await domain.validatePublication(before, options.actor, session);
        }
        const after = await casUpdate(
          repo,
          before,
          {
            status: options.hidden ? "hidden" : visible,
            ...(type === "comment" ? { parentHidden: false } : {}),
          },
          { session },
        );
        if (type === "comment") {
          let changed = 1;
          if (!before.parentCommentId) {
            for (;;) {
              const children = await repo.findMany(
                {
                  parentCommentId: before._id,
                  ...(options.hidden
                    ? { status: "visible" }
                    : { status: "hidden", parentHidden: true }),
                },
                { limit: 100, session },
              );
              if (!children.data.length) break;
              for (const child of children.data) {
                await casUpdate(
                  repo,
                  child,
                  { status: options.hidden ? "hidden" : "visible", parentHidden: options.hidden },
                  { session },
                );
                changed++;
              }
            }
          } else if (!options.hidden) {
            const parent = requireFound(await repo.findById(before.parentCommentId, { session }));
            if (parent.status !== "visible")
              throw AppError.conflict("The parent comment is not visible");
          }
          await adjustCounters(
            before.targetType,
            before.targetId,
            { commentCount: options.hidden ? -changed : changed },
            { session },
          );
        }
        await auditAdmin(
          deps,
          options,
          type,
          before,
          after,
          `${type}.${options.hidden ? "hide" : "restore"}`,
          session,
        );
        return after;
      },
      options.session,
    );
  };
  return { getTarget, adjustCounters, setVisibility, isPublic, publicFilter };
};
