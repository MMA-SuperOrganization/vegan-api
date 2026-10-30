export async function cleanupRecipeSocialArtifacts(database, { apply = false } = {}) {
  const comments = database.collection("comments");
  const reactions = database.collection("reactions");
  const recipes = database.collection("recipes");

  const found = {
    comments: await comments.countDocuments({ targetType: "recipe" }),
    reactions: await reactions.countDocuments({ targetType: "recipe" }),
    recipesWithSocialCounters: await recipes.countDocuments({
      $or: [{ commentCount: { $exists: true } }, { reactionCount: { $exists: true } }],
    }),
  };

  if (!apply) return { apply, found, removed: null };

  const [commentResult, reactionResult, recipeResult] = await Promise.all([
    comments.deleteMany({ targetType: "recipe" }),
    reactions.deleteMany({ targetType: "recipe" }),
    recipes.updateMany({}, { $unset: { commentCount: "", reactionCount: "" } }),
  ]);

  return {
    apply,
    found,
    removed: {
      comments: commentResult.deletedCount,
      reactions: reactionResult.deletedCount,
      recipeCounters: recipeResult.modifiedCount,
    },
  };
}
