import { describe, expect, it, vi } from "vitest";
import { cleanupRecipeSocialArtifacts } from "../../scripts/cleanup-recipe-social-core.js";

const collection = (count, result = {}) => ({
  countDocuments: vi.fn().mockResolvedValue(count),
  deleteMany: vi.fn().mockResolvedValue({ deletedCount: result.deletedCount ?? count }),
  updateMany: vi.fn().mockResolvedValue({ modifiedCount: result.modifiedCount ?? count }),
});

describe("recipe social cleanup", () => {
  it("previews legacy rows without mutating them", async () => {
    const collections = {
      comments: collection(2),
      reactions: collection(3),
      recipes: collection(4),
    };
    const database = { collection: (name) => collections[name] };

    const result = await cleanupRecipeSocialArtifacts(database);

    expect(result.found).toEqual({
      comments: 2,
      reactions: 3,
      recipesWithSocialCounters: 4,
    });
    expect(collections.comments.deleteMany).not.toHaveBeenCalled();
    expect(collections.recipes.updateMany).not.toHaveBeenCalled();
  });

  it("removes recipe social rows and unsets obsolete counters", async () => {
    const collections = {
      comments: collection(2),
      reactions: collection(3),
      recipes: collection(4),
    };
    const database = { collection: (name) => collections[name] };

    const result = await cleanupRecipeSocialArtifacts(database, { apply: true });

    expect(result.removed).toEqual({ comments: 2, reactions: 3, recipeCounters: 4 });
    expect(collections.recipes.updateMany).toHaveBeenCalledWith(
      {},
      { $unset: { commentCount: "", reactionCount: "" } },
    );
  });
});
