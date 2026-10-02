import { AppError } from "../../common/errors/app-error.js";

export const createReportsService = ({ reportsRepository }) => ({
  async createReport(req) {
    return await reportsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getMyReports(req) {
    return await reportsRepository.findAll(req.query);
  },
  async getMyReport(req) {
    return await reportsRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async getAdminReports(req) {
    return await reportsRepository.findAll(req.query);
  },
  async updateAdminReport(req) {
    return await reportsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
});
