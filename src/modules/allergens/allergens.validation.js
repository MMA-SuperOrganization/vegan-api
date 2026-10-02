import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAllergensValidation = () => ({
  getAllergens: {
    query: paginationSchema.passthrough(),
  },
  createAllergen: {
    body: z.object({}).passthrough(),
  },
  updateAllergen: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteAllergen: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
