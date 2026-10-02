import { sendSuccess } from "../../common/utils/api-response.js";

export const createRecipeController = ({ recipeService }) => ({
  async getRecipes(req, res) {
    const result = await recipeService.getRecipes(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Recipes retrieved", ...result });
  },

  async getMyRecipes(req, res) {
    const filter = { ...req.query.filter, authorId: req.auth.userId };
    const result = await recipeService.getRecipes(filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "My recipes retrieved", ...result });
  },

  async getRecipe(req, res) {
    const recipe = await recipeService.getRecipe(req.validated.params.idOrSlug);
    return sendSuccess(res, { message: "Recipe retrieved", data: recipe });
  },

  async createRecipe(req, res) {
    const recipe = await recipeService.createRecipe(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Recipe created", data: recipe }, 201);
  },

  async updateRecipe(req, res) {
    const recipe = await recipeService.updateRecipe(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Recipe updated", data: recipe });
  },

  async deleteRecipe(req, res) {
    await recipeService.deleteRecipe(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Recipe deleted" });
  },

  async submitRecipe(req, res) {
    await recipeService.submitRecipe(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Recipe submitted for review" });
  },

  // Admin
  async publishRecipe(req, res) {
    await recipeService.publishRecipe(req.validated.params.id);
    return sendSuccess(res, { message: "Recipe published" });
  },

  async rejectRecipe(req, res) {
    await recipeService.rejectRecipe(req.validated.params.id, req.body.reason);
    return sendSuccess(res, { message: "Recipe rejected" });
  },
});
