import { describe, expect, it } from "vitest";
import { buildVietnameseCommunityPosts } from "../../scripts/seed-vietnamese-community.js";

describe("Vietnamese community seed", () => {
  it("builds stable Vietnamese posts distributed across virtual authors", () => {
    const authors = Array.from({ length: 12 }, (_, index) => ({ _id: `author-${index}` }));
    const posts = buildVietnameseCommunityPosts({
      authors,
      recipeIds: ["recipe-1", "recipe-2", "recipe-3"],
      foodItemIds: Array.from({ length: 24 }, (_, index) => `food-${index}`),
      categoryIds: ["category-1"],
      now: new Date("2026-11-05T00:00:00.000Z"),
    });
    expect(posts).toHaveLength(72);
    expect(new Set(posts.map((post) => post.marker)).size).toBe(72);
    expect(new Set(posts.map((post) => post.document.authorId)).size).toBe(12);
    expect(posts.every((post) => post.document.tags.includes("bài-viết-tiếng-việt"))).toBe(true);
    expect(posts.every((post) => post.document.status === "published")).toBe(true);
    expect(posts.every((post) => post.document.recipeId || post.document.foodItemIds.length)).toBe(
      true,
    );
  });
});
