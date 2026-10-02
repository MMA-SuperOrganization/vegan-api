import { sendSuccess } from "../../common/utils/api-response.js";

export const createReportsController = ({ reportsService }) => ({
  async createReport(req, res) {
    const result = await reportsService.createReport(req);
    return sendSuccess(res, { data: result || {}, message: "createReport success" });
  },
  async getMyReports(req, res) {
    const result = await reportsService.getMyReports(req);
    return sendSuccess(res, { data: result || {}, message: "getMyReports success" });
  },
  async getMyReport(req, res) {
    const result = await reportsService.getMyReport(req);
    return sendSuccess(res, { data: result || {}, message: "getMyReport success" });
  },
  async getAdminReports(req, res) {
    const result = await reportsService.getAdminReports(req);
    return sendSuccess(res, { data: result || {}, message: "getAdminReports success" });
  },
  async updateAdminReport(req, res) {
    const result = await reportsService.updateAdminReport(req);
    return sendSuccess(res, { data: result || {}, message: "updateAdminReport success" });
  },
});
