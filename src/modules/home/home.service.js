import { z } from "zod";
import { integer, service, listData, isPublic, summarizeContent } from "../app-config/index.js";
export const homeValidation = {
  getHomeFeed: { query: z.object({ limit: integer(10, 6) }).strict() },
};
export const createHomeService = (deps) => ({
  async getHomeFeed({ actor, query = {} }) {
    const limit = Math.min(query.limit ?? 6, 10);
    const loadPublic = async (key, filters = {}) =>
      listData(
        await service(
          deps,
          key,
          "listPublic",
        )({
          page: 1,
          limit,
          sort: "popular",
          ...filters,
        }),
      )
        .filter(isPublic)
        .slice(0, limit);
    const [recipeRows, videoRows, postRows] = await Promise.all([
      loadPublic("recipes"),
      loadPublic("videos"),
      loadPublic("posts", { postType: "community" }),
    ]);
    const recipes = recipeRows.map(summarizeContent);
    const videos = videoRows.map(summarizeContent);
    const posts = postRows.map((post) => ({
      ...summarizeContent(post),
      excerpt: post.content?.slice(0, 220),
      recipeId: post.recipeId ?? null,
      foodItemIds: post.foodItemIds ?? [],
      relatedRecipe: post.relatedRecipe ?? null,
      relatedFoodItems: post.relatedFoodItems ?? [],
      reactionCount: post.reactionCount ?? 0,
      commentCount: post.commentCount ?? 0,
    }));
    const result = { featured: { recipes, videos, posts }, personalized: null };
    if (actor?.userId)
      result.personalized = {
        recipes: (
          await service(deps, "recommendations", "recipes")({ actor, query: { page: 1, limit } })
        ).data,
      };
    return result;
  },
});
