import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createNutritionProfilesRoutes = ({
  nutritionProfilesController,
  nutritionProfilesValidation,
}) => {
  const router = Router();
  router.get(
    "/nutrition-profiles/me",
    authenticate,
    validate(nutritionProfilesValidation.getMyNutritionProfile),
    asyncHandler(nutritionProfilesController.getMyNutritionProfile),
  );
  router.put(
    "/nutrition-profiles/me",
    authenticate,
    validate(nutritionProfilesValidation.upsertMyNutritionProfile),
    asyncHandler(nutritionProfilesController.upsertMyNutritionProfile),
  );
  router.post(
    "/nutrition-profiles/me/recalculate",
    authenticate,
    validate(nutritionProfilesValidation.recalculateNutritionTarget),
    asyncHandler(nutritionProfilesController.recalculateNutritionTarget),
  );
  return router;
};
