import { sendSuccess } from "../../common/utils/api-response.js";

export const createMealPlansController = ({ mealPlansService }) => ({
  async getMealPlans(req, res) {
    const result = await mealPlansService.getMealPlans(req);
    return sendSuccess(res, { data: result || {}, message: "getMealPlans success" });
  },
  async getCurrentMealPlan(req, res) {
    const result = await mealPlansService.getCurrentMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "getCurrentMealPlan success" });
  },
  async getMealPlan(req, res) {
    const result = await mealPlansService.getMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "getMealPlan success" });
  },
  async createMealPlan(req, res) {
    const result = await mealPlansService.createMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "createMealPlan success" });
  },
  async updateMealPlan(req, res) {
    const result = await mealPlansService.updateMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "updateMealPlan success" });
  },
  async deleteMealPlan(req, res) {
    const result = await mealPlansService.deleteMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "deleteMealPlan success" });
  },
  async addMealToPlan(req, res) {
    const result = await mealPlansService.addMealToPlan(req);
    return sendSuccess(res, { data: result || {}, message: "addMealToPlan success" });
  },
  async updateMealInPlan(req, res) {
    const result = await mealPlansService.updateMealInPlan(req);
    return sendSuccess(res, { data: result || {}, message: "updateMealInPlan success" });
  },
  async deleteMealFromPlan(req, res) {
    const result = await mealPlansService.deleteMealFromPlan(req);
    return sendSuccess(res, { data: result || {}, message: "deleteMealFromPlan success" });
  },
  async activateMealPlan(req, res) {
    const result = await mealPlansService.activateMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "activateMealPlan success" });
  },
  async cloneMealPlan(req, res) {
    const result = await mealPlansService.cloneMealPlan(req);
    return sendSuccess(res, { data: result || {}, message: "cloneMealPlan success" });
  },
  async generateGroceryListFromPlan(req, res) {
    const result = await mealPlansService.generateGroceryListFromPlan(req);
    return sendSuccess(res, { data: result || {}, message: "generateGroceryListFromPlan success" });
  },
});
