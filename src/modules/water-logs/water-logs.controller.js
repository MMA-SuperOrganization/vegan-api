import { sendSuccess } from "../../common/utils/api-response.js";

export const createWaterLogsController = ({ waterLogsService }) => ({
  async getWaterLogs(req, res) {
    const result = await waterLogsService.getWaterLogs(req);
    return sendSuccess(res, { data: result || {}, message: "getWaterLogs success" });
  },
  async createWaterLog(req, res) {
    const result = await waterLogsService.createWaterLog(req);
    return sendSuccess(res, { data: result || {}, message: "createWaterLog success" });
  },
  async updateWaterLog(req, res) {
    const result = await waterLogsService.updateWaterLog(req);
    return sendSuccess(res, { data: result || {}, message: "updateWaterLog success" });
  },
  async deleteWaterLog(req, res) {
    const result = await waterLogsService.deleteWaterLog(req);
    return sendSuccess(res, { data: result || {}, message: "deleteWaterLog success" });
  },
});
