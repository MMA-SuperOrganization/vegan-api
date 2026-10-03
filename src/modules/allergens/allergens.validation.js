import { z } from "zod";
import { id, text, patch, pagination, emptyBody } from "../../common/validators/domain.schemas.js";
export const allergenSchema = z
  .object({
    name: text(100),
    slug: text(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: text(2000, 0).optional(),
    severityNote: text(1000, 0).optional(),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .strict();
export const createAllergensValidation = () => ({
  getAllergens: { query: pagination.strict() },
  createAllergen: { body: allergenSchema },
  updateAllergen: {
    params: z.object({ id }).strict(),
    body: patch(allergenSchema.extend({ status: z.enum(["active", "inactive"]).optional() })),
  },
  deleteAllergen: { params: z.object({ id }).strict(), body: emptyBody },
});
