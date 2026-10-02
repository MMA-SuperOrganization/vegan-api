import { sendSuccess } from "../../common/utils/api-response.js";

export const createFoodItemController = ({ foodItemService }) => ({
  async searchFoodItems(req, res) {
    const result = await foodItemService.searchFoodItems(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Food items retrieved", ...result });
  },

  async getFoodItem(req, res) {
    const item = await foodItemService.getFoodItem(req.validated.params.id);
    return sendSuccess(res, { message: "Food item retrieved", data: item });
  },

  async createFoodItem(req, res) {
    const item = await foodItemService.createFoodItem(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Food item created", data: item }, 201);
  },

  async updateFoodItem(req, res) {
    const item = await foodItemService.updateFoodItem(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Food item updated", data: item });
  },

  async deleteFoodItem(req, res) {
    await foodItemService.deleteFoodItem(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Food item deactivated" });
  },
});
