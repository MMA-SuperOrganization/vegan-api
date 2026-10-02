import { AppError } from "../../common/errors/app-error.js";

export const createFoodItemsService = ({ foodItemsRepository }) => ({
  async searchFoodItems(req) {
    return await foodItemsRepository.findAll(req.query);
  },
  async getFoodItem(req) {
    return await foodItemsRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createFoodItem(req) {
    return await foodItemsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateFoodItem(req) {
    return await foodItemsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteFoodItem(req) {
    return await foodItemsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
