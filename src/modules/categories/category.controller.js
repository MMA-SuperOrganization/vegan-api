import { sendSuccess } from "../../common/utils/api-response.js";

export const createCategoryController = ({ categoryService }) => ({
  async getCategories(req, res) {
    const categories = await categoryService.getCategories(req.query);
    return sendSuccess(res, { message: "Categories retrieved", data: categories });
  },

  async createCategory(req, res) {
    const category = await categoryService.createCategory(req.validated.body);
    return sendSuccess(res, { message: "Category created", data: category }, 201);
  },

  async updateCategory(req, res) {
    const category = await categoryService.updateCategory(
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { message: "Category updated", data: category });
  },

  async deleteCategory(req, res) {
    await categoryService.deleteCategory(req.validated.params.id);
    return sendSuccess(res, { message: "Category deactivated" });
  },
});
