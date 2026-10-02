import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createOnboardingRoutes = ({ onboardingController, onboardingValidation }) => {
  const router = Router();
  router.get(
    "/onboarding/status",
    authenticate,
    validate(onboardingValidation.getOnboardingStatus),
    asyncHandler(onboardingController.getOnboardingStatus),
  );
  router.put(
    "/onboarding",
    authenticate,
    validate(onboardingValidation.updateOnboarding),
    asyncHandler(onboardingController.updateOnboarding),
  );
  router.post(
    "/onboarding/complete",
    authenticate,
    validate(onboardingValidation.completeOnboarding),
    asyncHandler(onboardingController.completeOnboarding),
  );
  return router;
};
