import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAdminDashboardValidation = () => ({
  getDashboardSummary: {
    query: paginationSchema.passthrough(),
  },
  getContentTrends: {
    query: paginationSchema.passthrough(),
  },
  getUserTrends: {
    query: paginationSchema.passthrough(),
  },
  getPendingContent: {
    query: paginationSchema.passthrough(),
  },
});
