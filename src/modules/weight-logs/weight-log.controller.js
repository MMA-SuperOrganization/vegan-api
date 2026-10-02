import { sendSuccess } from "../../common/utils/api-response.js";
export const createWeightLogController = ({ weightLogService }) => ({
  async getAll(req, res) {
    const logs = await weightLogService.getMyLogs(req.auth.userId);
    return sendSuccess(res, { data: logs });
  },
  async create(req, res) {
    const log = await weightLogService.createLog(req.auth.userId, req.validated.body);
    return sendSuccess(res, { data: log });
  },
  async update(req, res) {
    const log = await weightLogService.updateLog(
      req.auth.userId,
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { data: log });
  },
  async delete(req, res) {
    await weightLogService.deleteLog(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Log deleted" });
  },
});
