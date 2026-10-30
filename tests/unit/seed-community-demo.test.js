import { describe, expect, it } from "vitest";
import {
  buildCommunityDemoPosts,
  validateCommunitySeedConfig,
} from "../../scripts/seed-community-demo-core.js";

describe("community demo seed", () => {
  it("rejects placeholder or weak credentials", () => {
    expect(() => validateCommunitySeedConfig({ email: "CHANGE_ME" })).toThrow();
    expect(() =>
      validateCommunitySeedConfig({ email: "community@vegeta.test", password: "short" }),
    ).toThrow();
  });

  it("builds a long, recipe-linked public newsfeed without pending review", () => {
    const posts = buildCommunityDemoPosts({
      authorId: "author-id",
      recipeIds: ["recipe-1", "recipe-2", "recipe-3"],
      categoryIds: ["category-id"],
      now: new Date("2026-10-30T00:00:00.000Z"),
    });

    expect(posts).toHaveLength(24);
    expect(posts.every(({ document }) => document.status === "published")).toBe(true);
    expect(posts[0].document.recipeId).toBe("recipe-1");
    expect(posts[1].document.recipeId).toBeNull();
    expect(posts.every(({ document }) => document.postType === "community")).toBe(true);
    expect(posts[0].document.publishedAt.getTime()).toBeGreaterThan(
      posts.at(-1).document.publishedAt.getTime(),
    );
  });
});
