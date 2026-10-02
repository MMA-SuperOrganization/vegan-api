import { z } from "zod";

export const createCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: z.string().trim().min(1),
    description: z.string().trim().max(500).optional(),
    type: z.enum(["food", "recipe", "post"]),
    status: z.enum(["active", "inactive"]).optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

export const updateCategoryBodySchema = createCategoryBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
