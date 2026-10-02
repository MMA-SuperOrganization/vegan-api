import { sendSuccess } from "../../common/utils/api-response.js";

export const createNutritionProfileController = ({ nutritionProfileService }) => ({
  async getMyNutritionProfile(req, res) {
    const profile = await nutritionProfileService.getMyNutritionProfile(req.auth.userId);
    return sendSuccess(res, { message: "Nutrition profile retrieved", data: profile });
  },

  async upsertMyNutritionProfile(req, res) {
    const profile = await nutritionProfileService.upsertMyNutritionProfile(
      req.auth.userId,
      req.validated.body,
    );
    return sendSuccess(res, { message: "Nutrition profile upserted", data: profile });
  },

  async recalculateNutritionTarget(req, res) {
    const profile = await nutritionProfileService.recalculateNutritionTarget(req.auth.userId);
    return sendSuccess(res, { message: "Nutrition target recalculated", data: profile });
  },
});
