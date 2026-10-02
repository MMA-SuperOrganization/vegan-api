import { sendSuccess } from "../../common/utils/api-response.js";

export const createAdminDashboardController = ({ adminDashboardService }) => ({
  async getDashboardSummary(req, res) {
    const result = await adminDashboardService.getDashboardSummary(req);
    return sendSuccess(res, { data: result || {}, message: "getDashboardSummary success" });
  },
  async getContentTrends(req, res) {
    const result = await adminDashboardService.getContentTrends(req);
    return sendSuccess(res, { data: result || {}, message: "getContentTrends success" });
  },
  async getUserTrends(req, res) {
    const result = await adminDashboardService.getUserTrends(req);
    return sendSuccess(res, { data: result || {}, message: "getUserTrends success" });
  },
  async getPendingContent(req, res) {
    const result = await adminDashboardService.getPendingContent(req);
    return sendSuccess(res, { data: result || {}, message: "getPendingContent success" });
  },
});
