import { z } from "zod";
import { id, text, patch, pagination, emptyBody } from "../../common/validators/domain.schemas.js";
export const categorySchema = z
  .object({
    name: text(100),
    slug: text(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: text(2000, 0).optional(),
    type: z.enum(["food", "recipe", "post"]),
    status: z.enum(["active", "inactive"]).default("active"),
    sortOrder: z.number().int().min(-10000).max(10000).default(0),
  })
  .strict();
export const createCategoriesValidation = () => ({
  getCategories: {
    query: pagination.extend({ type: z.enum(["food", "recipe", "post"]).optional() }).strict(),
  },
  createCategory: { body: categorySchema },
  updateCategory: {
    params: z.object({ id }).strict(),
    body: patch(
      categorySchema.extend({
        status: z.enum(["active", "inactive"]).optional(),
        sortOrder: z.number().int().min(-10000).max(10000).optional(),
      }),
    ),
  },
  deleteCategory: { params: z.object({ id }).strict(), body: emptyBody },
});
