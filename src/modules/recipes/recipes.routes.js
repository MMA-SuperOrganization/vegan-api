import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createRecipesRoutes = ({ recipesController, recipesValidation }) => {
  const router = Router();
  router.get(
    "/recipes",
    validate(recipesValidation.getRecipes),
    asyncHandler(recipesController.getRecipes),
  );
  router.get(
    "/recipes/mine",
    authenticate,
    validate(recipesValidation.getMyRecipes),
    asyncHandler(recipesController.getMyRecipes),
  );
  router.get(
    "/recipes/:idOrSlug",
    optionalAuthenticate,
    validate(recipesValidation.getRecipe),
    asyncHandler(recipesController.getRecipe),
  );
  router.post(
    "/recipes",
    authenticate,
    validate(recipesValidation.createRecipe),
    asyncHandler(recipesController.createRecipe),
  );
  router.patch(
    "/recipes/:id",
    authenticate,
    validate(recipesValidation.updateRecipe),
    asyncHandler(recipesController.updateRecipe),
  );
  router.delete(
    "/recipes/:id",
    authenticate,
    validate(recipesValidation.deleteRecipe),
    asyncHandler(recipesController.deleteRecipe),
  );
  router.post(
    "/recipes/:id/submit",
    authenticate,
    validate(recipesValidation.submitRecipe),
    asyncHandler(recipesController.submitRecipe),
  );
  router.post(
    "/recipes/:id/publish",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(recipesValidation.publishRecipe),
    asyncHandler(recipesController.publishRecipe),
  );
  router.post(
    "/recipes/:id/reject",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(recipesValidation.rejectRecipe),
    asyncHandler(recipesController.rejectRecipe),
  );
  router.get(
    "/recipes/:id/nutrition",
    validate(recipesValidation.getRecipeNutrition),
    asyncHandler(recipesController.getRecipeNutrition),
  );
  return router;
};
