import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAuthRoutes = ({ authController, authValidation }) => {
  const router = Router();
  router.post(
    "/auth/sync",
    authenticate,
    validate(authValidation.syncAuth),
    asyncHandler(authController.syncAuth),
  );
  router.get(
    "/auth/me",
    authenticate,
    validate(authValidation.getMe),
    asyncHandler(authController.getMe),
  );
  router.post(
    "/auth/fcm-tokens",
    authenticate,
    validate(authValidation.addFcmToken),
    asyncHandler(authController.addFcmToken),
  );
  router.delete(
    "/auth/fcm-tokens/:tokenId",
    authenticate,
    validate(authValidation.removeFcmToken),
    asyncHandler(authController.removeFcmToken),
  );
  return router;
};
