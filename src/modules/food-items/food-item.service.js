import { AppError } from "../../common/errors/app-error.js";

export const createFoodItemService = ({ foodItemRepository }) => {
  return {
    async searchFoodItems(filter, options) {
      return foodItemRepository.findMany(filter, options);
    },

    async getFoodItem(id) {
      const item = await foodItemRepository.findById(id);
      if (!item) throw AppError.notFound("Food item not found");
      return item;
    },

    async createFoodItem(data, userId) {
      return foodItemRepository.create({ ...data, createdBy: userId });
    },

    async updateFoodItem(id, data, userId) {
      const updated = await foodItemRepository.updateById(id, { ...data, updatedBy: userId });
      if (!updated) throw AppError.notFound("Food item not found");
      return updated;
    },

    async deleteFoodItem(id, userId) {
      const updated = await foodItemRepository.updateById(id, {
        status: "inactive",
        updatedBy: userId,
      });
      if (!updated) throw AppError.notFound("Food item not found");
      return updated;
    },
  };
};
