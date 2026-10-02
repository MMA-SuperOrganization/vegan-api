import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createHealthRoutes = ({ healthController, healthValidation }) => {
  const router = Router();
  router.get(
    "/health",
    validate(healthValidation.checkLiveness),
    asyncHandler(healthController.checkLiveness),
  );
  router.get(
    "/health/ready",
    validate(healthValidation.checkReadiness),
    asyncHandler(healthController.checkReadiness),
  );
  return router;
};
