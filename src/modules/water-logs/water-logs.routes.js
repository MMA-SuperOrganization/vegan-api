import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createWaterLogsRoutes = ({ waterLogsController, waterLogsValidation }) => {
  const router = Router();
  router.get(
    "/water-logs",
    authenticate,
    validate(waterLogsValidation.getWaterLogs),
    asyncHandler(waterLogsController.getWaterLogs),
  );
  router.post(
    "/water-logs",
    authenticate,
    validate(waterLogsValidation.createWaterLog),
    asyncHandler(waterLogsController.createWaterLog),
  );
  router.patch(
    "/water-logs/:id",
    authenticate,
    validate(waterLogsValidation.updateWaterLog),
    asyncHandler(waterLogsController.updateWaterLog),
  );
  router.delete(
    "/water-logs/:id",
    authenticate,
    validate(waterLogsValidation.deleteWaterLog),
    asyncHandler(waterLogsController.deleteWaterLog),
  );
  return router;
};
