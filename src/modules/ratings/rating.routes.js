import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { addRatingBodySchema } from "./rating.validation.js";
import { z } from "zod";

export const createRatingRoutes = (container) => {
  const router = Router();
  const { ratingController, authenticate } = container;

  const targetParams = z.object({
    targetType: z.enum(["recipe", "video"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  });

  router.put(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams, body: addRatingBodySchema }),
    asyncHandler(ratingController.addRating),
  );
  router.delete(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams }),
    asyncHandler(ratingController.removeRating),
  );
  router.get(
    "/:targetType/:targetId/summary",
    validate({ params: targetParams }),
    asyncHandler(ratingController.getRatingSummary),
  );

  return router;
};
