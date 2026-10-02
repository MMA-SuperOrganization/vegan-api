import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createReportsValidation = () => ({
  createReport: {
    body: z.object({}).passthrough(),
  },
  getMyReports: {
    query: paginationSchema.passthrough(),
  },
  getMyReport: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  getAdminReports: {
    query: paginationSchema.passthrough(),
  },
  updateAdminReport: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
});
