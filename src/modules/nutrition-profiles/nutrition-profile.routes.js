import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { upsertNutritionProfileBodySchema } from "./nutrition-profile.validation.js";

export const createNutritionProfileRoutes = (container) => {
  const router = Router();
  const { nutritionProfileController, authenticate } = container;

  router.get("/me", authenticate, asyncHandler(nutritionProfileController.getMyNutritionProfile));
  router.put(
    "/me",
    authenticate,
    validate({ body: upsertNutritionProfileBodySchema }),
    asyncHandler(nutritionProfileController.upsertMyNutritionProfile),
  );
  router.post(
    "/me/recalculate",
    authenticate,
    asyncHandler(nutritionProfileController.recalculateNutritionTarget),
  );

  return router;
};
