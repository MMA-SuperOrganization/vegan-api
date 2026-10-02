import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAiMonitoringValidation = () => ({
  getAiRuns: {
    query: paginationSchema.passthrough(),
  },
  getAiRunDetail: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  getAiMetrics: {
    query: paginationSchema.passthrough(),
  },
  getAiFeedback: {
    query: paginationSchema.passthrough(),
  },
});
