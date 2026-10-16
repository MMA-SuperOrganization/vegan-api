import { z } from "zod";
import { id, text, patch, pagination, emptyBody } from "../../common/validators/domain.schemas.js";
import { MASTER_DATA_STATUSES } from "../../common/constants/enums/master-data.enums.js";

export const allergenSchema = z
  .object({
    name: text(100),
    slug: text(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: text(2000, 0).optional(),
    severityNote: text(1000, 0).optional(),
    status: z.enum(MASTER_DATA_STATUSES.values()).default(MASTER_DATA_STATUSES.ACTIVE),
  })
  .strict();
export const createAllergensValidation = () => ({
  getAllergens: {
    query: pagination.extend({ status: z.enum(MASTER_DATA_STATUSES.values()).optional() }).strict(),
  },
  createAllergen: { body: allergenSchema },
  updateAllergen: {
    params: z.object({ id }).strict(),
    body: patch(allergenSchema.extend({ status: z.enum(MASTER_DATA_STATUSES.values()).optional() })),
  },
  deleteAllergen: { params: z.object({ id }).strict(), body: emptyBody },
});
