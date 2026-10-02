import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createRecommendationsRoutes = ({
  recommendationsController,
  recommendationsValidation,
}) => {
  const router = Router();
  router.get(
    "/discover",
    optionalAuthenticate,
    validate(recommendationsValidation.discoverContent),
    asyncHandler(recommendationsController.discoverContent),
  );
  router.get(
    "/recommendations/recipes",
    authenticate,
    validate(recommendationsValidation.getRecipeRecommendations),
    asyncHandler(recommendationsController.getRecipeRecommendations),
  );
  router.get(
    "/recommendations/content",
    authenticate,
    validate(recommendationsValidation.getContentRecommendations),
    asyncHandler(recommendationsController.getContentRecommendations),
  );
  return router;
};
