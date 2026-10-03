import { z } from "zod";
import { integer, service, listData, isPublic, summarizeContent } from "../app-config/index.js";
export const homeValidation = {
  getHomeFeed: { query: z.object({ limit: integer(10, 6) }).strict() },
};
export const createHomeService = (deps) => ({
  async getHomeFeed({ actor, query = {} }) {
    const limit = Math.min(query.limit ?? 6, 10);
    const [recipes, videos, posts] = await Promise.all(
      ["recipes", "videos", "posts"].map(async (key) =>
        listData(
          await service(
            deps,
            key,
            "listPublic",
          )({ page: 1, limit, sort: "popular", ...(key === "posts" ? { postType: "blog" } : {}) }),
        )
          .filter(isPublic)
          .slice(0, limit)
          .map(summarizeContent),
      ),
    );
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
