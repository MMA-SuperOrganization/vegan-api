import { AppError } from "../../common/errors/app-error.js";

export const createCategoryService = ({ categoryRepository }) => {
  return {
    async getCategories(filter, options) {
      return categoryRepository.findMany(filter, options);
    },

    async createCategory(data) {
      return categoryRepository.create(data);
    },

    async updateCategory(id, data) {
      const updated = await categoryRepository.updateById(id, data);
      if (!updated) throw AppError.notFound("Category not found");
      return updated;
    },

    async deleteCategory(id) {
      const updated = await categoryRepository.updateById(id, { status: "inactive" });
      if (!updated) throw AppError.notFound("Category not found");
      return updated;
    },
  };
};
