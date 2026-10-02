import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const createRecommendationRoutes = (container) => {
  const router = Router();
  const { recommendationController, authenticate } = container;

  // Make authenticate optional for discover if we had an optionalAuth middleware.
  // For now, we use authenticate.
  router.get("/discover", authenticate, asyncHandler(recommendationController.getDiscoverFeed));

  router.get(
    "/recipes",
    authenticate,
    asyncHandler(recommendationController.getRecipeRecommendations),
  );
  router.get(
    "/content",
    authenticate,
    asyncHandler(recommendationController.getContentRecommendations),
  );

  return router;
};
