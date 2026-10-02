import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createRatingsValidation = () => ({
  upsertRating: {
    body: z.object({}).passthrough(),
  },
  deleteRating: {},
  getRatingSummary: {
    query: paginationSchema.passthrough(),
  },
});
