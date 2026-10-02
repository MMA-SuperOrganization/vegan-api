import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAiMonitoringRoutes = ({ aiMonitoringController, aiMonitoringValidation }) => {
  const router = Router();
  router.get(
    "/admin/ai/runs",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(aiMonitoringValidation.getAiRuns),
    asyncHandler(aiMonitoringController.getAiRuns),
  );
  router.get(
    "/admin/ai/runs/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(aiMonitoringValidation.getAiRunDetail),
    asyncHandler(aiMonitoringController.getAiRunDetail),
  );
  router.get(
    "/admin/ai/metrics",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(aiMonitoringValidation.getAiMetrics),
    asyncHandler(aiMonitoringController.getAiMetrics),
  );
  router.get(
    "/admin/ai/feedback",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(aiMonitoringValidation.getAiFeedback),
    asyncHandler(aiMonitoringController.getAiFeedback),
  );
  return router;
};
