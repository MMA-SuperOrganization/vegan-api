import { sendSuccess } from "../../common/utils/api-response.js";
export const createWaterLogController = ({ waterLogService }) => ({
  async getAll(req, res) {
    const logs = await waterLogService.getMyLogs(req.auth.userId);
    return sendSuccess(res, { data: logs });
  },
  async create(req, res) {
    const log = await waterLogService.createLog(req.auth.userId, req.validated.body);
    return sendSuccess(res, { data: log });
  },
  async update(req, res) {
    const log = await waterLogService.updateLog(
      req.auth.userId,
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { data: log });
  },
  async delete(req, res) {
    await waterLogService.deleteLog(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Log deleted" });
  },
});
