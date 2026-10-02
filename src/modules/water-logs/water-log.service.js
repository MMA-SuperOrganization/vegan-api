import { AppError } from "../../common/errors/app-error.js";
export const createWaterLogService = ({ waterLogRepository }) => ({
  async getMyLogs(userId) {
    return waterLogRepository.findMany({ userId });
  },
  async createLog(userId, data) {
    return waterLogRepository.create({ userId, ...data });
  },
  async updateLog(userId, logId, data) {
    const log = await waterLogRepository.findById(logId);
    if (!log || String(log.userId) !== userId) throw AppError.notFound("Log not found");
    return waterLogRepository.updateById(logId, data);
  },
  async deleteLog(userId, logId) {
    const log = await waterLogRepository.findById(logId);
    if (!log || String(log.userId) !== userId) throw AppError.notFound("Log not found");
    return waterLogRepository.deleteById(logId);
  },
});
