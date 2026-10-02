import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createWeightLogsRoutes = ({ weightLogsController, weightLogsValidation }) => {
  const router = Router();
  router.get(
    "/weight-logs",
    authenticate,
    validate(weightLogsValidation.getWeightLogs),
    asyncHandler(weightLogsController.getWeightLogs),
  );
  router.post(
    "/weight-logs",
    authenticate,
    validate(weightLogsValidation.createWeightLog),
    asyncHandler(weightLogsController.createWeightLog),
  );
  router.patch(
    "/weight-logs/:id",
    authenticate,
    validate(weightLogsValidation.updateWeightLog),
    asyncHandler(weightLogsController.updateWeightLog),
  );
  router.delete(
    "/weight-logs/:id",
    authenticate,
    validate(weightLogsValidation.deleteWeightLog),
    asyncHandler(weightLogsController.deleteWeightLog),
  );
  router.get(
    "/weight-logs/trend",
    authenticate,
    validate(weightLogsValidation.getWeightTrend),
    asyncHandler(weightLogsController.getWeightTrend),
  );
  return router;
};
