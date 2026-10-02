import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createVideoBodySchema, updateVideoBodySchema } from "./video.validation.js";
import { z } from "zod";

export const createVideoRoutes = (container) => {
  const router = Router();
  const { videoController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const idOrSlugParam = z.object({ idOrSlug: z.string().trim().min(1) });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(videoController.getVideos));
  router.get("/mine", authenticate, asyncHandler(videoController.getMyVideos));
  router.get(
    "/:idOrSlug",
    validate({ params: idOrSlugParam }),
    asyncHandler(videoController.getVideo),
  );

  router.post(
    "/",
    authenticate,
    validate({ body: createVideoBodySchema }),
    asyncHandler(videoController.createVideo),
  );
  router.patch(
    "/:id",
    authenticate,
    validate({ params: objectIdParam, body: updateVideoBodySchema }),
    asyncHandler(videoController.updateVideo),
  );
  router.delete(
    "/:id",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(videoController.deleteVideo),
  );

  router.post(
    "/:id/submit",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(videoController.submitVideo),
  );

  router.post(
    "/:id/publish",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(videoController.publishVideo),
  );
  router.post(
    "/:id/reject",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(videoController.rejectVideo),
  );

  return router;
};
