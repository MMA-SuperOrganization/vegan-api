import { sendSuccess } from "../../common/utils/api-response.js";

export const createNutritionProfilesController = ({ nutritionProfilesService }) => ({
  async getMyNutritionProfile(req, res) {
    const result = await nutritionProfilesService.getMyNutritionProfile(req);
    return sendSuccess(res, { data: result || {}, message: "getMyNutritionProfile success" });
  },
  async upsertMyNutritionProfile(req, res) {
    const result = await nutritionProfilesService.upsertMyNutritionProfile(req);
    return sendSuccess(res, { data: result || {}, message: "upsertMyNutritionProfile success" });
  },
  async recalculateNutritionTarget(req, res) {
    const result = await nutritionProfilesService.recalculateNutritionTarget(req);
    return sendSuccess(res, { data: result || {}, message: "recalculateNutritionTarget success" });
  },
});
