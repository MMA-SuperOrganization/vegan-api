import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createModerationValidation = () => ({
  getModerationCases: {
    query: paginationSchema.passthrough(),
  },
  createModerationCase: {
    body: z.object({}).passthrough(),
  },
  updateModerationCase: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  hideContent: {
    body: z.object({}).passthrough(),
  },
  restoreContent: {
    body: z.object({}).passthrough(),
  },
});
