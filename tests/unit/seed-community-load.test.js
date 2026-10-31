import { describe, expect, it } from "vitest";

import {
  buildCommunityLoadPosts,
  COMMUNITY_LOAD_TAG_PREFIX,
  parseCommunityLoadCount,
} from "../../scripts/seed-community-load-core.js";

describe("community load seed", () => {
  it("validates the requested post count", () => {
    expect(parseCommunityLoadCount("1000")).toBe(1000);
    expect(() => parseCommunityLoadCount(0)).toThrow();
    expect(() => parseCommunityLoadCount(10_001)).toThrow();
    expect(() => parseCommunityLoadCount("many")).toThrow();
  });

  it("builds deterministic public posts with a recipe or ingredient relationship", () => {
    const posts = buildCommunityLoadPosts({
      authorIds: ["author-1", "author-2"],
      recipes: [{ _id: "recipe-1", title: "Đậu hũ sốt nấm" }],
      foodItems: [
        { _id: "food-1", name: "Đậu hũ" },
        { _id: "food-2", name: "Nấm" },
      ],
      categoryIds: ["category-1"],
      count: 1000,
      now: new Date("2026-10-31T00:00:00.000Z"),
    });

    expect(posts).toHaveLength(1000);
    expect(posts[0].marker).toBe(`${COMMUNITY_LOAD_TAG_PREFIX}0001`);
    expect(posts.at(-1).marker).toBe(`${COMMUNITY_LOAD_TAG_PREFIX}1000`);
    expect(new Set(posts.map(({ marker }) => marker)).size).toBe(1000);
    expect(
      posts.every(({ document }) => Boolean(document.recipeId || document.foodItemIds.length)),
    ).toBe(true);
    expect(posts.every(({ document }) => document.status === "published")).toBe(true);
    expect(posts[0].document.authorId).toBe("author-1");
    expect(posts[1].document.authorId).toBe("author-2");
  });
});
