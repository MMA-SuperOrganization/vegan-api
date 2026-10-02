import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAuthValidation = () => ({
  syncAuth: {
    body: z.object({}).passthrough(),
  },
  getMe: {
    query: paginationSchema.passthrough(),
  },
  addFcmToken: {
    body: z.object({}).passthrough(),
  },
  removeFcmToken: {},
});
