import { AppError } from "../../common/errors/app-error.js";
export const createMealPlanService = ({ mealPlanRepository }) => ({
  async getMyPlans(userId) {
    return mealPlanRepository.findMany({ userId });
  },
  async createPlan(userId, data) {
    return mealPlanRepository.create({ userId, ...data });
  },
  async getPlan(userId, planId) {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan || String(plan.userId) !== userId) throw AppError.notFound("Meal plan not found");
    return plan;
  },
  async updatePlan(userId, planId, data) {
    const plan = await this.getPlan(userId, planId);
    return mealPlanRepository.updateById(planId, data);
  },
  async deletePlan(userId, planId) {
    const plan = await this.getPlan(userId, planId);
    return mealPlanRepository.deleteById(planId);
  },
});
