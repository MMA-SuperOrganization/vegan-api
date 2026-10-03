import { z } from "zod";
import { text, targetParams } from "../../common/validators/domain.schemas.js";
const params = targetParams(["recipe", "video"]);
export const createRatingsValidation = () => ({
  upsertRating: {
    params,
    body: z
      .object({ score: z.number().int().min(1).max(5), review: text(3000, 0).optional() })
      .strict(),
  },
  deleteRating: { params },
  getRatingSummary: { params },
});
