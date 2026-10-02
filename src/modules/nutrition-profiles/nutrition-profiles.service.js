import { AppError } from "../../common/errors/app-error.js";

export const createNutritionProfilesService = ({ nutritionProfilesRepository }) => ({
  async getMyNutritionProfile(req) {
    return await nutritionProfilesRepository.findAll(req.query);
  },
  async upsertMyNutritionProfile(req) {
    return await nutritionProfilesRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async recalculateNutritionTarget(req) {
    return await nutritionProfilesRepository.create({
      ...req.validated.body,
      userId: req.auth?.userId,
    });
  },
});
