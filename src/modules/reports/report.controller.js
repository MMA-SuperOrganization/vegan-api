import { sendSuccess } from "../../common/utils/api-response.js";

export const createReportController = ({ reportService }) => ({
  async createReport(req, res) {
    const report = await reportService.createReport(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Report created", data: report }, 201);
  },

  async getMyReports(req, res) {
    const result = await reportService.getMyReports(req.auth.userId, req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "My reports retrieved", ...result });
  },

  async getMyReportDetail(req, res) {
    const report = await reportService.getMyReportDetail(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Report detail retrieved", data: report });
  },

  // Admin
  async getReports(req, res) {
    const result = await reportService.getReports(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Reports retrieved", ...result });
  },

  async updateReport(req, res) {
    const report = await reportService.updateReport(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: "Report updated", data: report });
  },
});
