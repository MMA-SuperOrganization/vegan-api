import { AppError } from "../../common/errors/app-error.js";

export const createAdminDashboardService = ({ adminDashboardRepository }) => ({
  async getDashboardSummary(req) {
    return await adminDashboardRepository.findAll(req.query);
  },
  async getContentTrends(req) {
    return await adminDashboardRepository.findAll(req.query);
  },
  async getUserTrends(req) {
    return await adminDashboardRepository.findAll(req.query);
  },
  async getPendingContent(req) {
    return await adminDashboardRepository.findAll(req.query);
  },
});
