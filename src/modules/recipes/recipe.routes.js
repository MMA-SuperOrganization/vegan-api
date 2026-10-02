import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createRecipeBodySchema, updateRecipeBodySchema } from "./recipe.validation.js";
import { z } from "zod";

export const createRecipeRoutes = (container) => {
  const router = Router();
  const { recipeController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const idOrSlugParam = z.object({ idOrSlug: z.string().trim().min(1) });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(recipeController.getRecipes));
  router.get("/mine", authenticate, asyncHandler(recipeController.getMyRecipes));
  router.get(
    "/:idOrSlug",
    validate({ params: idOrSlugParam }),
    asyncHandler(recipeController.getRecipe),
  );

  router.post(
    "/",
    authenticate,
    validate({ body: createRecipeBodySchema }),
    asyncHandler(recipeController.createRecipe),
  );
  router.patch(
    "/:id",
    authenticate,
    validate({ params: objectIdParam, body: updateRecipeBodySchema }),
    asyncHandler(recipeController.updateRecipe),
  );
  router.delete(
    "/:id",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(recipeController.deleteRecipe),
  );

  router.post(
    "/:id/submit",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(recipeController.submitRecipe),
  );

  router.post(
    "/:id/publish",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(recipeController.publishRecipe),
  );
  router.post(
    "/:id/reject",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(recipeController.rejectRecipe),
  );

  return router;
};
