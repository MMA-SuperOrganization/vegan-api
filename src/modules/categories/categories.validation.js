import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createCategoriesValidation = () => ({
  getCategories: {
    query: paginationSchema.passthrough(),
  },
  createCategory: {
    body: z.object({}).passthrough(),
  },
  updateCategory: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteCategory: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
