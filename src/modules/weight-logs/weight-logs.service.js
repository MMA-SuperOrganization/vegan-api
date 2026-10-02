import { AppError } from "../../common/errors/app-error.js";

export const createWeightLogsService = ({ weightLogsRepository }) => ({
  async getWeightLogs(req) {
    return await weightLogsRepository.findAll(req.query);
  },
  async createWeightLog(req) {
    return await weightLogsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateWeightLog(req) {
    return await weightLogsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteWeightLog(req) {
    return await weightLogsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async getWeightTrend(req) {
    return await weightLogsRepository.findAll(req.query);
  },
});
