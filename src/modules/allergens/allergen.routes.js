import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createAllergenBodySchema, updateAllergenBodySchema } from "./allergen.validation.js";
import { z } from "zod";

export const createAllergenRoutes = (container) => {
  const router = Router();
  const { allergenController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(allergenController.getAllergens));

  router.post(
    "/",
    authenticate,
    requireAdmin,
    validate({ body: createAllergenBodySchema }),
    asyncHandler(allergenController.createAllergen),
  );

  router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam, body: updateAllergenBodySchema }),
    asyncHandler(allergenController.updateAllergen),
  );

  router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(allergenController.deleteAllergen),
  );

  return router;
};
