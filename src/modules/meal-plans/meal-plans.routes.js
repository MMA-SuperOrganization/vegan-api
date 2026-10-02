import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createMealPlansRoutes = ({ mealPlansController, mealPlansValidation }) => {
  const router = Router();
  router.get(
    "/meal-plans",
    authenticate,
    validate(mealPlansValidation.getMealPlans),
    asyncHandler(mealPlansController.getMealPlans),
  );
  router.get(
    "/meal-plans/current",
    authenticate,
    validate(mealPlansValidation.getCurrentMealPlan),
    asyncHandler(mealPlansController.getCurrentMealPlan),
  );
  router.get(
    "/meal-plans/:id",
    authenticate,
    validate(mealPlansValidation.getMealPlan),
    asyncHandler(mealPlansController.getMealPlan),
  );
  router.post(
    "/meal-plans",
    authenticate,
    validate(mealPlansValidation.createMealPlan),
    asyncHandler(mealPlansController.createMealPlan),
  );
  router.patch(
    "/meal-plans/:id",
    authenticate,
    validate(mealPlansValidation.updateMealPlan),
    asyncHandler(mealPlansController.updateMealPlan),
  );
  router.delete(
    "/meal-plans/:id",
    authenticate,
    validate(mealPlansValidation.deleteMealPlan),
    asyncHandler(mealPlansController.deleteMealPlan),
  );
  router.post(
    "/meal-plans/:id/meals",
    authenticate,
    validate(mealPlansValidation.addMealToPlan),
    asyncHandler(mealPlansController.addMealToPlan),
  );
  router.patch(
    "/meal-plans/:id/meals/:mealId",
    authenticate,
    validate(mealPlansValidation.updateMealInPlan),
    asyncHandler(mealPlansController.updateMealInPlan),
  );
  router.delete(
    "/meal-plans/:id/meals/:mealId",
    authenticate,
    validate(mealPlansValidation.deleteMealFromPlan),
    asyncHandler(mealPlansController.deleteMealFromPlan),
  );
  router.post(
    "/meal-plans/:id/activate",
    authenticate,
    validate(mealPlansValidation.activateMealPlan),
    asyncHandler(mealPlansController.activateMealPlan),
  );
  router.post(
    "/meal-plans/:id/clone",
    authenticate,
    validate(mealPlansValidation.cloneMealPlan),
    asyncHandler(mealPlansController.cloneMealPlan),
  );
  router.post(
    "/meal-plans/:id/grocery-list",
    authenticate,
    validate(mealPlansValidation.generateGroceryListFromPlan),
    asyncHandler(mealPlansController.generateGroceryListFromPlan),
  );
  return router;
};
