import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createWaterLogsValidation = () => ({
  getWaterLogs: {
    query: paginationSchema.passthrough(),
  },
  createWaterLog: {
    body: z.object({}).passthrough(),
  },
  updateWaterLog: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteWaterLog: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
