import { z } from "zod";

export const createAllergenBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: z.string().trim().min(1),
    description: z.string().trim().max(500).optional(),
    severityNote: z.string().trim().max(500).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

export const updateAllergenBodySchema = createAllergenBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
