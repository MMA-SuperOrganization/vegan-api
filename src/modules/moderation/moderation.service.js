import { AppError } from "../../common/errors/app-error.js";

export const createModerationService = ({ moderationRepository }) => ({
  async getModerationCases(req) {
    return await moderationRepository.findAll(req.query);
  },
  async createModerationCase(req) {
    return await moderationRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateModerationCase(req) {
    return await moderationRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async hideContent(req) {
    return await moderationRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async restoreContent(req) {
    return await moderationRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
