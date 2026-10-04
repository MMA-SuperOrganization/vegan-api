import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { requireFound, assertOwner, publicFilter, slug } from "../../common/domain.js";
import {
  requireActor,
  transaction,
  auditAdmin,
  getReadable,
  safeContent,
  assertEditable,
  casUpdate,
  listFilter,
  listOptions,
  lifecycle,
  syncMedia,
  userState,
} from "../../common/content-service.js";
export const createVideosService = (deps) => {
  const repo = deps.repositories.videos;
  const validateMetadata = (video) => {
    let previousEnd = 0;
    for (const chapter of video.chapters ?? []) {
      if (
        !Number.isFinite(chapter.startSeconds) ||
        !Number.isFinite(chapter.endSeconds) ||
        chapter.startSeconds < previousEnd ||
        chapter.endSeconds <= chapter.startSeconds ||
        chapter.endSeconds > video.durationSeconds
      )
        throw AppError.badRequest(
          "Chapters must be ordered, non-overlapping, and inside video duration",
        );
      previousEnd = chapter.endSeconds;
    }
  };
  const validateReferences = async (video, actor, session) => {
    validateMetadata(video);
    await syncMedia(deps, "video", video, video, actor, session);
    if (video.recipeId)
      await deps.services.recipes.getById(video.recipeId, { actor, publicOnly: true, session });
  };
  const validatePublication = async (video, actor, session) => {
    if (!video.videoMediaId || !video.title || !(video.durationSeconds > 0))
      throw AppError.badRequest("Video requires ready media and a duration");
    await validateReferences(video, actor, session);
  };
  const listPublic = (query = {}, options = {}) =>
    repo.findMany(
      publicFilter({
        ...listFilter(query),
        ...(query.recipeId ? { recipeId: query.recipeId } : {}),
        ...(query.maxDurationSeconds
          ? { durationSeconds: { $lte: query.maxDurationSeconds } }
          : {}),
      }),
      { ...listOptions(query), ...options },
    );
  const listMine = (userId, query = {}) =>
    repo.findMany(
      {
        authorId: userId,
        ...(query.status
          ? { status: query.status }
          : { deletedAt: null, status: { $ne: "deleted" } }),
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sort: { updatedAt: -1, _id: -1 },
        projection: { viewReceipts: 0, ratingSum: 0 },
      },
    );
  const getById = (id, options = {}) => getReadable(repo, id, options);
  const updateSummary = async (id, changes, context) =>
    transaction(
      deps,
      async (session) => {
        requireActor(context.actor);
        const before = requireFound(await repo.findById(id, { session }));
        assertOwner(before, context.actor, { field: "authorId", allowAdmin: true });
        if (["deleted", "hidden", "processing"].includes(before.status) || before.deletedAt)
          throw AppError.conflict("Video summary cannot be changed in this state");
        const allowed = {};
        if (changes.summary != null) allowed.summary = changes.summary;
        if (changes.transcript != null) allowed.transcript = changes.transcript;
        if (changes.chapters != null) allowed.chapters = changes.chapters;
        validateMetadata({ ...before, ...allowed });
        const after = await casUpdate(repo, before, allowed, { version: context.version, session });
        await auditAdmin(deps, context, "video", before, after, "video.summary", session);
        return safeContent(after, { actor: context.actor });
      },
      context.session,
    );
  const operations = {
    getVideos: async ({ query = {} }) => listPublic(query),
    getMyVideos: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await listMine(actor.userId, query);
      return { ...result, data: result.data.map((item) => safeContent(item, { actor })) };
    },
    getVideo: async ({ actor, params }) => {
      const video = await getReadable(repo, params.idOrSlug, { actor, slug: true });
      const media = await deps.services.media.getById(video.videoMediaId, { actor });
      return {
        ...safeContent(video, { actor }),
        playback: media,
        ...(await userState(deps, "video", video._id, actor)),
      };
    },
    createVideo: (context) =>
      transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        validateMetadata(body);
        const video = await repo.create(
          {
            ...body,
            authorId: actor.userId,
            slug: `${slug(body.title)}-${randomUUID().slice(0, 8)}`,
            status: "draft",
            visibility: body.visibility ?? "public",
            deletedAt: null,
            version: 0,
          },
          { session },
        );
        await validateReferences(video, actor, session);
        await syncMedia(deps, "video", null, video, actor, session);
        await auditAdmin(deps, context, "video", null, video, "video.create", session);
        return safeContent(video, { actor });
      }),
    updateVideo: (context) =>
      transaction(deps, async (session) => {
        const { actor, params, body } = context;
        const before = requireFound(await repo.findById(params.id, { session }));
        assertEditable(before, actor);
        const { version, ...changes } = body;
        if (before.status === "rejected")
          Object.assign(changes, { status: "draft", rejectionReason: null });
        const candidate = { ...before, ...changes };
        await validateReferences(candidate, actor, session);
        await syncMedia(deps, "video", before, candidate, actor, session);
        const after = await casUpdate(repo, before, changes, { version, session });
        await auditAdmin(deps, context, "video", before, after, "video.update", session);
        return safeContent(after, { actor });
      }),
    deleteVideo: (context) =>
      lifecycle(deps, repo, "video", context, "delete", validatePublication),
    submitVideo: (context) =>
      lifecycle(deps, repo, "video", context, "submit", validatePublication),
    publishVideo: (context) =>
      lifecycle(deps, repo, "video", context, "publish", validatePublication),
    rejectVideo: (context) =>
      lifecycle(deps, repo, "video", context, "reject", validatePublication),
    getRelatedVideos: async ({ params, query = {} }) => {
      const video = await getById(params.id, { publicOnly: true });
      const candidates = [];
      if (video.recipeId) candidates.push({ recipeId: video.recipeId });
      if (video.categoryIds?.length) candidates.push({ categoryIds: { $in: video.categoryIds } });
      if (video.tags?.length) candidates.push({ tags: { $in: video.tags } });
      const related = await repo.findMany(
        publicFilter({
          _id: { $ne: video._id },
          ...(candidates.length ? { $or: candidates } : {}),
        }),
        { ...listOptions(query) },
      );
      let recipe = null;
      if (video.recipeId) {
        try {
          recipe = safeContent(
            await deps.services.recipes.getById(video.recipeId, { publicOnly: true }),
          );
        } catch (error) {
          if (error.statusCode !== 404) throw error;
        }
      }
      return { data: related.data, meta: { ...related.meta, recipe } };
    },
    updateVideoProgress: async ({ actor, params, body }) => {
      requireActor(actor);
      if (!deps.services.history)
        throw AppError.serviceUnavailable("History service is unavailable");
      return deps.services.history.updateProgress(actor, params.id, body);
    },
    getVideoTranscript: async ({ params }) => {
      const video = await getById(params.id, { publicOnly: true });
      return {
        videoId: video._id,
        transcript: video.transcript ?? null,
        chapters: video.chapters ?? [],
        summary: video.summary ?? null,
      };
    },
    generateVideoSummaryFromVideoId: async (context) => {
      requireActor(context.actor);
      const video = await getById(context.params.id, { actor: context.actor });
      assertOwner(video, context.actor, { field: "authorId", allowAdmin: true });
      if (!deps.services.ai?.generateVideoSummary)
        throw AppError.serviceUnavailable("AI summary service is unavailable");
      const result = await deps.services.ai.generateVideoSummary({
        ...context,
        body: { videoId: String(video._id) },
      });
      await updateSummary(
        video._id,
        { summary: result.summary, ...(result.chapters ? { chapters: result.chapters } : {}) },
        { ...context, version: video.version ?? 0 },
      );
      return result;
    },
  };
  return {
    operations,
    service: { getById, listPublic, listMine, validatePublication, updateSummary },
  };
};
