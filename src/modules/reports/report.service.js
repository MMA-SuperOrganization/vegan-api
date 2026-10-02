import { AppError } from "../../common/errors/app-error.js";

export const createReportService = ({ reportRepository }) => {
  return {
    async createReport(data, userId) {
      return reportRepository.create({ ...data, reporterId: userId });
    },

    async getMyReports(userId, filter = {}, options) {
      return reportRepository.findMany({ ...filter, reporterId: userId }, options);
    },

    async getMyReportDetail(id, userId) {
      const report = await reportRepository.findById(id);
      if (!report || String(report.reporterId) !== String(userId)) throw AppError.notFound();
      return report;
    },

    // Admin
    async getReports(filter, options) {
      return reportRepository.findMany(filter, options);
    },

    async updateReport(id, data) {
      const updated = await reportRepository.updateById(id, data);
      if (!updated) throw AppError.notFound();
      return updated;
    },
  };
};
