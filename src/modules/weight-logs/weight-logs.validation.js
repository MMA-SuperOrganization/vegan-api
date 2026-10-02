import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createWeightLogsValidation = () => ({
  getWeightLogs: {
    query: paginationSchema.passthrough(),
  },
  createWeightLog: {
    body: z.object({}).passthrough(),
  },
  updateWeightLog: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteWeightLog: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  getWeightTrend: {
    query: paginationSchema.passthrough(),
  },
});
