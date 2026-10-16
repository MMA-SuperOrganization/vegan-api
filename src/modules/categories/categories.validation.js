import { z } from "zod";
import { id, text, patch, pagination, emptyBody } from "../../common/validators/domain.schemas.js";
import {
  CATEGORY_TYPES,
  MASTER_DATA_STATUSES,
} from "../../common/constants/enums/master-data.enums.js";

export const categorySchema = z
  .object({
    name: text(100),
    slug: text(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: text(2000, 0).optional(),
    parentId: id.nullable().optional(),
    type: z.enum(CATEGORY_TYPES.values()),
    status: z.enum(MASTER_DATA_STATUSES.values()).default(MASTER_DATA_STATUSES.ACTIVE),
    sortOrder: z.number().int().min(-10000).max(10000).default(0),
  })
  .strict();
export const createCategoriesValidation = () => ({
  getCategories: {
    query: pagination
      .extend({
        type: z.enum(CATEGORY_TYPES.values()).optional(),
        parentId: id.optional(),
        status: z.enum(MASTER_DATA_STATUSES.values()).optional(),
      })
      .strict(),
  },
  createCategory: { body: categorySchema },
  updateCategory: {
    params: z.object({ id }).strict(),
    body: patch(
      categorySchema.extend({
        status: z.enum(MASTER_DATA_STATUSES.values()).optional(),
        sortOrder: z.number().int().min(-10000).max(10000).optional(),
      }),
    ),
  },
  deleteCategory: { params: z.object({ id }).strict(), body: emptyBody },
});
