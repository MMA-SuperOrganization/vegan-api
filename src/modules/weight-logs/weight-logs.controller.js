import { sendSuccess } from "../../common/utils/api-response.js";

export const createWeightLogsController = ({ weightLogsService }) => ({
  async getWeightLogs(req, res) {
    const result = await weightLogsService.getWeightLogs(req);
    return sendSuccess(res, { data: result || {}, message: "getWeightLogs success" });
  },
  async createWeightLog(req, res) {
    const result = await weightLogsService.createWeightLog(req);
    return sendSuccess(res, { data: result || {}, message: "createWeightLog success" });
  },
  async updateWeightLog(req, res) {
    const result = await weightLogsService.updateWeightLog(req);
    return sendSuccess(res, { data: result || {}, message: "updateWeightLog success" });
  },
  async deleteWeightLog(req, res) {
    const result = await weightLogsService.deleteWeightLog(req);
    return sendSuccess(res, { data: result || {}, message: "deleteWeightLog success" });
  },
  async getWeightTrend(req, res) {
    const result = await weightLogsService.getWeightTrend(req);
    return sendSuccess(res, { data: result || {}, message: "getWeightTrend success" });
  },
});
