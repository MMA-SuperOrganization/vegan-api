import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createFoodItemsRoutes = ({ foodItemsController, foodItemsValidation }) => {
  const router = Router();
  router.get(
    "/food-items",
    validate(foodItemsValidation.searchFoodItems),
    asyncHandler(foodItemsController.searchFoodItems),
  );
  router.get(
    "/food-items/:id",
    validate(foodItemsValidation.getFoodItem),
    asyncHandler(foodItemsController.getFoodItem),
  );
  router.post(
    "/food-items",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(foodItemsValidation.createFoodItem),
    asyncHandler(foodItemsController.createFoodItem),
  );
  router.patch(
    "/food-items/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(foodItemsValidation.updateFoodItem),
    asyncHandler(foodItemsController.updateFoodItem),
  );
  router.delete(
    "/food-items/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(foodItemsValidation.deleteFoodItem),
    asyncHandler(foodItemsController.deleteFoodItem),
  );
  return router;
};
