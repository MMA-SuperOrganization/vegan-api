import { sendSuccess } from "../../common/utils/api-response.js";

export const createRecipesController = ({ recipesService }) => ({
  async getRecipes(req, res) {
    const result = await recipesService.getRecipes(req);
    return sendSuccess(res, { data: result || {}, message: "getRecipes success" });
  },
  async getMyRecipes(req, res) {
    const result = await recipesService.getMyRecipes(req);
    return sendSuccess(res, { data: result || {}, message: "getMyRecipes success" });
  },
  async getRecipe(req, res) {
    const result = await recipesService.getRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "getRecipe success" });
  },
  async createRecipe(req, res) {
    const result = await recipesService.createRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "createRecipe success" });
  },
  async updateRecipe(req, res) {
    const result = await recipesService.updateRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "updateRecipe success" });
  },
  async deleteRecipe(req, res) {
    const result = await recipesService.deleteRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "deleteRecipe success" });
  },
  async submitRecipe(req, res) {
    const result = await recipesService.submitRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "submitRecipe success" });
  },
  async publishRecipe(req, res) {
    const result = await recipesService.publishRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "publishRecipe success" });
  },
  async rejectRecipe(req, res) {
    const result = await recipesService.rejectRecipe(req);
    return sendSuccess(res, { data: result || {}, message: "rejectRecipe success" });
  },
  async getRecipeNutrition(req, res) {
    const result = await recipesService.getRecipeNutrition(req);
    return sendSuccess(res, { data: result || {}, message: "getRecipeNutrition success" });
  },
});
