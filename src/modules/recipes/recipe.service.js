import { AppError } from "../../common/errors/app-error.js";

export const createRecipeService = ({ recipeRepository }) => {
  return {
    async getRecipes(filter, options) {
      return recipeRepository.findMany(filter, options);
    },

    async getRecipe(idOrSlug) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
      const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
      const res = await recipeRepository.findMany(filter, { limit: 1 });
      const recipe = res.data[0];
      if (!recipe) throw AppError.notFound("Recipe not found");
      return recipe;
    },

    async createRecipe(data, userId) {
      return recipeRepository.create({ ...data, authorId: userId });
    },

    async updateRecipe(id, data, userId) {
      const existing = await recipeRepository.findById(id);
      if (!existing) throw AppError.notFound("Recipe not found");
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      const updated = await recipeRepository.updateById(id, data);
      return updated;
    },

    async deleteRecipe(id, userId) {
      const existing = await recipeRepository.findById(id);
      if (!existing) throw AppError.notFound("Recipe not found");
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      await recipeRepository.updateById(id, { status: "hidden" }); // logical delete
    },

    async submitRecipe(id, userId) {
      const updated = await recipeRepository.updateById(id, { status: "pending" });
      if (!updated) throw AppError.notFound();
      return updated;
    },

    async publishRecipe(id) {
      return recipeRepository.updateById(id, { status: "published", publishedAt: new Date() });
    },

    async rejectRecipe(id, reason) {
      return recipeRepository.updateById(id, { status: "rejected", moderationNote: reason });
    },
  };
};
