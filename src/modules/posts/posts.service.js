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
  now,
  requireAdmin,
  syncMedia,
  userState,
} from "../../common/content-service.js";
export const createPostsService = (deps) => {
  const repo = deps.repositories.posts;
  const objectId = (value) => String(value?._id ?? value ?? "");
  const enrichFoodRelationships = async (posts) => {
    if (!posts.length) return posts;
    const recipeIds = [...new Set(posts.map((post) => objectId(post.recipeId)).filter(Boolean))];
    const foodItemIds = [
      ...new Set(posts.flatMap((post) => (post.foodItemIds ?? []).map(objectId)).filter(Boolean)),
    ];
    const [recipes, foodItems] = await Promise.all([
      recipeIds.length
        ? deps.repositories.recipes.findMany(
            { _id: { $in: recipeIds } },
            {
              page: 1,
              limit: recipeIds.length,
              projection: { title: 1, slug: 1, coverImageUrl: 1 },
            },
          )
        : { data: [] },
      foodItemIds.length
        ? deps.repositories.foodItems.findMany(
            { _id: { $in: foodItemIds } },
            {
              page: 1,
              limit: foodItemIds.length,
              projection: { name: 1, slug: 1, imageUrl: 1 },
            },
          )
        : { data: [] },
    ]);
    const recipesById = new Map(recipes.data.map((recipe) => [objectId(recipe), recipe]));
    const foodItemsById = new Map(foodItems.data.map((foodItem) => [objectId(foodItem), foodItem]));
    return posts.map((post) => ({
      ...post,
      relatedRecipe: post.recipeId ? (recipesById.get(objectId(post.recipeId)) ?? null) : null,
      relatedFoodItems: (post.foodItemIds ?? [])
        .map((id) => foodItemsById.get(objectId(id)))
        .filter(Boolean),
    }));
  };
  const enrichPage = async (page) => ({
    ...page,
    data: await enrichFoodRelationships(page.data),
  });
  const assertRecipeExists = async (recipeId, session) => {
    if (recipeId) requireFound(await deps.repositories.recipes.findById(recipeId, { session }));
  };
  const assertFoodItemsExist = async (foodItemIds = [], session) => {
    for (const foodItemId of foodItemIds) {
      const food = requireFound(
        await deps.repositories.foodItems.findById(foodItemId, { session }),
        "Ingredient not found",
      );
      if (food.status === "inactive") throw AppError.notFound("Ingredient not found");
    }
  };
  const assertFoodRelationship = (post) => {
    if (!post.recipeId && !post.foodItemIds?.length)
      throw AppError.badRequest("A post must link at least one ingredient or one recipe");
  };
  const assertReferences = async (post, session) => {
    assertFoodRelationship(post);
    await assertRecipeExists(post.recipeId, session);
    await assertFoodItemsExist(post.foodItemIds, session);
  };
  const validatePublication = async (post, actor, session) => {
    if (!post.title?.trim() || !post.content?.trim())
      throw AppError.badRequest("A post requires a title and content");
    await assertReferences(post, session);
    await syncMedia(deps, "post", post, post, actor, session);
  };
  const listPublic = async (query = {}, options = {}) =>
    enrichPage(
      await repo.findMany(
        publicFilter({
          ...listFilter(query),
          ...(query.postType ? { postType: query.postType } : {}),
          ...(query.recipeId ? { recipeId: query.recipeId } : {}),
        }),
        { ...listOptions(query), ...options },
      ),
    );
  const listMine = async (userId, query = {}) =>
    enrichPage(
      await repo.findMany(
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
      ),
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
      const [enrichedPost] = await enrichFoodRelationships([post]);
      return {
        ...safeContent(enrichedPost, { actor }),
        ...(await userState(deps, "post", post._id, actor)),
      };
    },
    createPost: (context) =>
      transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        if (body.postType === "blog" && actor.role !== "admin")
          throw AppError.forbidden("Only administrators can create blogs");
        await assertReferences(body, session);
        const communityPost = (body.postType ?? "community") === "community";
        const post = await repo.create(
          {
            ...body,
            authorId: actor.userId,
            postType: body.postType ?? "community",
            status: communityPost ? "published" : "draft",
            publishedAt: communityPost ? now(deps) : null,
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
        const communityPost = (changes.postType ?? before.postType ?? "community") === "community";
        if (communityPost)
          Object.assign(changes, {
            status: "published",
            publishedAt: before.publishedAt ?? now(deps),
            rejectionReason: null,
          });
        else if (before.status === "rejected")
          Object.assign(changes, { status: "draft", rejectionReason: null });
        if (!communityPost && before.status === "published" && actor.role !== "admin")
          Object.assign(changes, { status: "draft", publishedAt: null });
        const candidate = { ...before, ...changes };
        await assertReferences(candidate, session);
        if (
          candidate.status === "published" &&
          (!candidate.title?.trim() || !candidate.content?.trim())
        )
          throw AppError.badRequest("A post requires a title and content");
        await syncMedia(deps, "post", before, candidate, actor, session);
        const after = await casUpdate(repo, before, changes, { version, session });
        await auditAdmin(deps, context, "post", before, after, "post.update", session);
        return safeContent(after, { actor });
      }),
    deletePost: (context) => lifecycle(deps, repo, "post", context, "delete", validatePublication),
    submitPost: async (context) => {
      const existing = requireFound(await repo.findById(context.params.id));
      if (existing.postType === "community" && existing.status === "published") {
        assertEditable(existing, context.actor);
        return safeContent(existing, { actor: context.actor });
      }
      return lifecycle(deps, repo, "post", context, "submit", validatePublication);
    },
    publishPost: async (context) => {
      const existing = requireFound(await repo.findById(context.params.id));
      if (existing.postType === "community" && existing.status === "published") {
        requireAdmin(context.actor);
        return safeContent(existing, { actor: context.actor });
      }
      return lifecycle(deps, repo, "post", context, "publish", validatePublication);
    },
    rejectPost: (context) => lifecycle(deps, repo, "post", context, "reject", validatePublication),
  };
  return { operations, service: { getById, listPublic, listMine, validatePublication } };
};
