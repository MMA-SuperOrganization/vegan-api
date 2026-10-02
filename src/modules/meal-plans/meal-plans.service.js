import { AppError } from "../../common/errors/app-error.js";

export const createMealPlansService = ({ mealPlansRepository }) => ({
  async getMealPlans(req) {
    return await mealPlansRepository.findAll(req.query);
  },
  async getCurrentMealPlan(req) {
    return await mealPlansRepository.findAll(req.query);
  },
  async getMealPlan(req) {
    return await mealPlansRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createMealPlan(req) {
    return await mealPlansRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateMealPlan(req) {
    return await mealPlansRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteMealPlan(req) {
    return await mealPlansRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async addMealToPlan(req) {
    return await mealPlansRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateMealInPlan(req) {
    return await mealPlansRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteMealFromPlan(req) {
    return await mealPlansRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async activateMealPlan(req) {
    return await mealPlansRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async cloneMealPlan(req) {
    return await mealPlansRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async generateGroceryListFromPlan(req) {
    return await mealPlansRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
