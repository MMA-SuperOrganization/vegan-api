import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createFoodItemBodySchema, updateFoodItemBodySchema } from "./food-item.validation.js";
import { z } from "zod";

export const createFoodItemRoutes = (container) => {
  const router = Router();
  const { foodItemController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(foodItemController.searchFoodItems));
  router.get(
    "/:id",
    validate({ params: objectIdParam }),
    asyncHandler(foodItemController.getFoodItem),
  );

  router.post(
    "/",
    authenticate,
    requireAdmin,
    validate({ body: createFoodItemBodySchema }),
    asyncHandler(foodItemController.createFoodItem),
  );

  router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam, body: updateFoodItemBodySchema }),
    asyncHandler(foodItemController.updateFoodItem),
  );

  router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(foodItemController.deleteFoodItem),
  );

  return router;
};
