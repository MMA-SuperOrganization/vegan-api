import { AppError } from "../../common/errors/app-error.js";

export const createCategoriesService = ({ categoriesRepository }) => ({
  async getCategories(req) {
    return await categoriesRepository.findAll(req.query);
  },
  async createCategory(req) {
    return await categoriesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateCategory(req) {
    return await categoriesRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteCategory(req) {
    return await categoriesRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
