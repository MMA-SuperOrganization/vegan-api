import { z } from "zod";
import { targetParams } from "../../common/validators/domain.schemas.js";
export const createReactionsValidation = () => ({
  upsertReaction: {
    params: targetParams(["recipe", "post", "video", "comment"]),
    body: z.object({ type: z.enum(["like", "love", "helpful"]) }).strict(),
  },
  deleteReaction: { params: targetParams(["recipe", "post", "video", "comment"]) },
});
