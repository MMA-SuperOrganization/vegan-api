import { AppError } from "../../common/errors/app-error.js";
import { requireFound, publicFilter } from "../../common/domain.js";
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
} from "../recipes/content.service.js";
export const createPostsService = (deps) => {
  const repo = deps.repositories.posts;
  const validatePublication = async (post, actor, session) => {
    if (!post.title?.trim() || !post.content?.trim())
      throw AppError.badRequest("A post requires a title and content");
    await syncMedia(deps, "post", post, post, actor, session);
  };
  const listPublic = (query = {}, options = {}) =>
    repo.findMany(
      publicFilter({
        ...listFilter(query),
        ...(query.postType ? { postType: query.postType } : {}),
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
        ...(query.postType ? { postType: query.postType } : {}),
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sort: { updatedAt: -1, _id: -1 },
        projection: { viewReceipts: 0, ratingSum: 0 },
      },
    );
  const getById = (id, options = {}) => getReadable(repo, id, options);
  const operations = {
    getPosts: async ({ query = {} }) => listPublic(query),
    getMyPosts: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await listMine(actor.userId, query);
      return { ...result, data: result.data.map((item) => safeContent(item, { actor })) };
    },
    getPost: async ({ actor, params }) => {
      const post = await getById(params.id, { actor });
      return {
        ...safeContent(post, { actor }),
        ...(await userState(deps, "post", post._id, actor)),
      };
    },
    createPost: (context) =>
      transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        if (body.postType === "blog" && actor.role !== "admin")
          throw AppError.forbidden("Only administrators can create blogs");
        const post = await repo.create(
          {
            ...body,
            authorId: actor.userId,
            postType: body.postType ?? "community",
            status: "draft",
            visibility: body.visibility ?? "public",
            deletedAt: null,
            version: 0,
          },
          { session },
        );
        await syncMedia(deps, "post", null, post, actor, session);
        await auditAdmin(deps, context, "post", null, post, "post.create", session);
        return safeContent(post, { actor });
      }),
    updatePost: (context) =>
      transaction(deps, async (session) => {
        const { actor, params, body } = context;
        const before = requireFound(await repo.findById(params.id, { session }));
        assertEditable(before, actor);
        const { version, ...changes } = body;
        if (changes.postType === "blog" && actor.role !== "admin")
          throw AppError.forbidden("Only administrators can create blogs");
        if (before.status === "rejected")
          Object.assign(changes, { status: "draft", rejectionReason: null });
        const candidate = { ...before, ...changes };
        await syncMedia(deps, "post", before, candidate, actor, session);
        if (before.status === "published") await validatePublication(candidate, actor, session);
        const after = await casUpdate(repo, before, changes, { version, session });
        await auditAdmin(deps, context, "post", before, after, "post.update", session);
        return safeContent(after, { actor });
      }),
    deletePost: (context) => lifecycle(deps, repo, "post", context, "delete", validatePublication),
    submitPost: (context) => lifecycle(deps, repo, "post", context, "submit", validatePublication),
    publishPost: (context) =>
      lifecycle(deps, repo, "post", context, "publish", validatePublication),
    rejectPost: (context) => lifecycle(deps, repo, "post", context, "reject", validatePublication),
  };
  return { operations, service: { getById, listPublic, listMine, validatePublication } };
};
