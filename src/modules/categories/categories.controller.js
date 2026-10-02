import { sendSuccess } from "../../common/utils/api-response.js";

export const createCategoriesController = ({ categoriesService }) => ({
  async getCategories(req, res) {
    const result = await categoriesService.getCategories(req);
    return sendSuccess(res, { data: result || {}, message: "getCategories success" });
  },
  async createCategory(req, res) {
    const result = await categoriesService.createCategory(req);
    return sendSuccess(res, { data: result || {}, message: "createCategory success" });
  },
  async updateCategory(req, res) {
    const result = await categoriesService.updateCategory(req);
    return sendSuccess(res, { data: result || {}, message: "updateCategory success" });
  },
  async deleteCategory(req, res) {
    const result = await categoriesService.deleteCategory(req);
    return sendSuccess(res, { data: result || {}, message: "deleteCategory success" });
  },
});
