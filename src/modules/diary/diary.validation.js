import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createDiaryValidation = () => ({
  getDiaryEntries: {
    query: paginationSchema.passthrough(),
  },
  createDiaryEntry: {
    body: z.object({}).passthrough(),
  },
  updateDiaryEntry: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteDiaryEntry: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  getDiarySummary: {
    query: paginationSchema.passthrough(),
  },
});
