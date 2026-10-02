import { AppError } from "../../common/errors/app-error.js";

export const createOnboardingService = ({ onboardingRepository }) => ({
  async getOnboardingStatus(req) {
    return await onboardingRepository.findAll(req.query);
  },
  async updateOnboarding(req) {
    return await onboardingRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async completeOnboarding(req) {
    return await onboardingRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
