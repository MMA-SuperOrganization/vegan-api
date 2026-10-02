import { AppError } from "../../common/errors/app-error.js";

export const createAiMonitoringService = ({ aiMonitoringRepository }) => ({
  async getAiRuns(req) {
    return await aiMonitoringRepository.findAll(req.query);
  },
  async getAiRunDetail(req) {
    return await aiMonitoringRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async getAiMetrics(req) {
    return await aiMonitoringRepository.findAll(req.query);
  },
  async getAiFeedback(req) {
    return await aiMonitoringRepository.findAll(req.query);
  },
});
