import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAppConfigRoutes = ({ appConfigController, appConfigValidation }) => {
  const router = Router();
  router.get(
    "/app/config",
    validate(appConfigValidation.getAppConfig),
    asyncHandler(appConfigController.getAppConfig),
  );
  router.get(
    "/app/bootstrap",
    optionalAuthenticate,
    validate(appConfigValidation.bootstrapApp),
    asyncHandler(appConfigController.bootstrapApp),
  );
  return router;
};
