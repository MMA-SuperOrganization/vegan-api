import { sendSuccess } from "../../common/utils/api-response.js";

export const createFoodItemsController = ({ foodItemsService }) => ({
  async searchFoodItems(req, res) {
    const result = await foodItemsService.searchFoodItems(req);
    return sendSuccess(res, { data: result || {}, message: "searchFoodItems success" });
  },
  async getFoodItem(req, res) {
    const result = await foodItemsService.getFoodItem(req);
    return sendSuccess(res, { data: result || {}, message: "getFoodItem success" });
  },
  async createFoodItem(req, res) {
    const result = await foodItemsService.createFoodItem(req);
    return sendSuccess(res, { data: result || {}, message: "createFoodItem success" });
  },
  async updateFoodItem(req, res) {
    const result = await foodItemsService.updateFoodItem(req);
    return sendSuccess(res, { data: result || {}, message: "updateFoodItem success" });
  },
  async deleteFoodItem(req, res) {
    const result = await foodItemsService.deleteFoodItem(req);
    return sendSuccess(res, { data: result || {}, message: "deleteFoodItem success" });
  },
});
