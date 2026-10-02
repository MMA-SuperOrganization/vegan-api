import { AppError } from "../../common/errors/app-error.js";

export const createHealthService = ({ healthRepository, getDatabaseStatus }) => ({
  async checkLiveness(req) {
    return await healthRepository.findAll(req.query);
  },
  async checkReadiness(req) {
    return await healthRepository.findAll(req.query);
  },
  getDatabaseStatus() {
    return getDatabaseStatus ? getDatabaseStatus() : 'disconnected';
  }
});
