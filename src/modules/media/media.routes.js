import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createMediaRoutes = ({ mediaController, mediaValidation }) => {
  const router = Router();
  router.post(
    "/media/upload-requests",
    authenticate,
    validate(mediaValidation.createUploadRequest),
    asyncHandler(mediaController.createUploadRequest),
  );
  router.get(
    "/media/mine",
    authenticate,
    validate(mediaValidation.getMyMedia),
    asyncHandler(mediaController.getMyMedia),
  );
  router.post(
    "/media/:id/confirm",
    authenticate,
    validate(mediaValidation.confirmMediaUpload),
    asyncHandler(mediaController.confirmMediaUpload),
  );
  router.get(
    "/media/:id",
    optionalAuthenticate,
    validate(mediaValidation.getMediaAsset),
    asyncHandler(mediaController.getMediaAsset),
  );
  router.delete(
    "/media/:id",
    authenticate,
    validate(mediaValidation.deleteMediaAsset),
    asyncHandler(mediaController.deleteMediaAsset),
  );
  return router;
};
