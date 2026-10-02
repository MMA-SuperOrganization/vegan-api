import { sendSuccess } from "../../common/utils/api-response.js";

export const createAiMonitoringController = ({ aiMonitoringService }) => ({
  async getAiRuns(req, res) {
    const result = await aiMonitoringService.getAiRuns(req);
    return sendSuccess(res, { data: result || {}, message: "getAiRuns success" });
  },
  async getAiRunDetail(req, res) {
    const result = await aiMonitoringService.getAiRunDetail(req);
    return sendSuccess(res, { data: result || {}, message: "getAiRunDetail success" });
  },
  async getAiMetrics(req, res) {
    const result = await aiMonitoringService.getAiMetrics(req);
    return sendSuccess(res, { data: result || {}, message: "getAiMetrics success" });
  },
  async getAiFeedback(req, res) {
    const result = await aiMonitoringService.getAiFeedback(req);
    return sendSuccess(res, { data: result || {}, message: "getAiFeedback success" });
  },
});
