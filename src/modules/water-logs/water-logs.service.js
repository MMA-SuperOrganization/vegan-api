import { AppError } from "../../common/errors/app-error.js";

export const createWaterLogsService = ({ waterLogsRepository }) => ({
  async getWaterLogs(req) {
    return await waterLogsRepository.findAll(req.query);
  },
  async createWaterLog(req) {
    return await waterLogsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateWaterLog(req) {
    return await waterLogsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteWaterLog(req) {
    return await waterLogsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
