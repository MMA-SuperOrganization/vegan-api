import { AppError } from "../../common/errors/app-error.js";

export const createRecipesService = ({ recipesRepository }) => ({
  async getRecipes(req) {
    return await recipesRepository.findAll(req.query);
  },
  async getMyRecipes(req) {
    return await recipesRepository.findAll(req.query);
  },
  async getRecipe(req) {
    return await recipesRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createRecipe(req) {
    return await recipesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateRecipe(req) {
    return await recipesRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteRecipe(req) {
    return await recipesRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async submitRecipe(req) {
    return await recipesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async publishRecipe(req) {
    return await recipesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async rejectRecipe(req) {
    return await recipesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getRecipeNutrition(req) {
    return await recipesRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
});
