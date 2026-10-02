import { AppError } from "../../common/errors/app-error.js";

export const createAuthService = ({ authRepository }) => ({
  async syncAuth(req) {
    return await authRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getMe(req) {
    return await authRepository.findAll(req.query);
  },
  async addFcmToken(req) {
    return await authRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async removeFcmToken(req) {
    return await authRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
