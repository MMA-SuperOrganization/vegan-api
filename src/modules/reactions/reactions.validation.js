import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createReactionsValidation = () => ({
  upsertReaction: {
    body: z.object({}).passthrough(),
  },
  deleteReaction: {},
});
