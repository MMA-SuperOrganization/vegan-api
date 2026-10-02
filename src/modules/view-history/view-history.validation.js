import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createViewHistoryValidation = () => ({
  getViewHistory: {
    query: paginationSchema.passthrough(),
  },
  clearViewHistory: {},
  deleteViewHistoryItem: {},
  recordView: {
    body: z.object({}).passthrough(),
  },
});
