import { AppError } from "../../common/errors/app-error.js";
export const createWeightLogService = ({ weightLogRepository }) => ({
  async getMyLogs(userId) {
    return weightLogRepository.findMany({ userId });
  },
  async createLog(userId, data) {
    return weightLogRepository.create({ userId, ...data });
  },
  async updateLog(userId, logId, data) {
    const log = await weightLogRepository.findById(logId);
    if (!log || String(log.userId) !== userId) throw AppError.notFound("Log not found");
    return weightLogRepository.updateById(logId, data);
  },
  async deleteLog(userId, logId) {
    const log = await weightLogRepository.findById(logId);
    if (!log || String(log.userId) !== userId) throw AppError.notFound("Log not found");
    return weightLogRepository.deleteById(logId);
  },
});
