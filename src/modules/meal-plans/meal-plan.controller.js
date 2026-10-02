import { sendSuccess } from "../../common/utils/api-response.js";
export const createMealPlanController = ({ mealPlanService }) => ({
  async getAll(req, res) {
    const plans = await mealPlanService.getMyPlans(req.auth.userId);
    return sendSuccess(res, { data: plans });
  },
  async getById(req, res) {
    const plan = await mealPlanService.getPlan(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { data: plan });
  },
  async create(req, res) {
    const plan = await mealPlanService.createPlan(req.auth.userId, req.validated.body);
    return sendSuccess(res, { data: plan });
  },
  async update(req, res) {
    const plan = await mealPlanService.updatePlan(
      req.auth.userId,
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { data: plan });
  },
  async delete(req, res) {
    await mealPlanService.deletePlan(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Meal plan deleted" });
  },
});
