import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createNutritionProfilesValidation = () => ({
  getMyNutritionProfile: {
    query: paginationSchema.passthrough(),
  },
  upsertMyNutritionProfile: {
    body: z.object({}).passthrough(),
  },
  recalculateNutritionTarget: {
    body: z.object({}).passthrough(),
  },
});
