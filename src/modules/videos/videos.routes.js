import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createVideosRoutes = ({ videosController, videosValidation }) => {
  const router = Router();
  router.get(
    "/videos",
    validate(videosValidation.getVideos),
    asyncHandler(videosController.getVideos),
  );
  router.get(
    "/videos/mine",
    authenticate,
    validate(videosValidation.getMyVideos),
    asyncHandler(videosController.getMyVideos),
  );
  router.get(
    "/videos/:idOrSlug",
    optionalAuthenticate,
    validate(videosValidation.getVideo),
    asyncHandler(videosController.getVideo),
  );
  router.post(
    "/videos",
    authenticate,
    validate(videosValidation.createVideo),
    asyncHandler(videosController.createVideo),
  );
  router.patch(
    "/videos/:id",
    authenticate,
    validate(videosValidation.updateVideo),
    asyncHandler(videosController.updateVideo),
  );
  router.delete(
    "/videos/:id",
    authenticate,
    validate(videosValidation.deleteVideo),
    asyncHandler(videosController.deleteVideo),
  );
  router.post(
    "/videos/:id/submit",
    authenticate,
    validate(videosValidation.submitVideo),
    asyncHandler(videosController.submitVideo),
  );
  router.post(
    "/videos/:id/publish",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(videosValidation.publishVideo),
    asyncHandler(videosController.publishVideo),
  );
  router.post(
    "/videos/:id/reject",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(videosValidation.rejectVideo),
    asyncHandler(videosController.rejectVideo),
  );
  router.get(
    "/videos/:id/related",
    validate(videosValidation.getRelatedVideos),
    asyncHandler(videosController.getRelatedVideos),
  );
  router.put(
    "/videos/:id/progress",
    authenticate,
    validate(videosValidation.updateVideoProgress),
    asyncHandler(videosController.updateVideoProgress),
  );
  router.get(
    "/videos/:id/transcript",
    validate(videosValidation.getVideoTranscript),
    asyncHandler(videosController.getVideoTranscript),
  );
  router.post(
    "/videos/:id/generate-summary",
    authenticate,
    validate(videosValidation.generateVideoSummaryFromVideoId),
    asyncHandler(videosController.generateVideoSummaryFromVideoId),
  );
  return router;
};
