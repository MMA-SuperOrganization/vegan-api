import { sendSuccess } from "../../common/utils/api-response.js";

export const createOnboardingController = ({ onboardingService }) => ({
  async getOnboardingStatus(req, res) {
    const result = await onboardingService.getOnboardingStatus(req);
    return sendSuccess(res, { data: result || {}, message: "getOnboardingStatus success" });
  },
  async updateOnboarding(req, res) {
    const result = await onboardingService.updateOnboarding(req);
    return sendSuccess(res, { data: result || {}, message: "updateOnboarding success" });
  },
  async completeOnboarding(req, res) {
    const result = await onboardingService.completeOnboarding(req);
    return sendSuccess(res, { data: result || {}, message: "completeOnboarding success" });
  },
});
