import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createCategoryBodySchema, updateCategoryBodySchema } from "./category.validation.js";
import { z } from "zod";

export const createCategoryRoutes = (container) => {
  const router = Router();
  const { categoryController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(categoryController.getCategories));

  router.post(
    "/",
    authenticate,
    requireAdmin,
    validate({ body: createCategoryBodySchema }),
    asyncHandler(categoryController.createCategory),
  );

  router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam, body: updateCategoryBodySchema }),
    asyncHandler(categoryController.updateCategory),
  );

  router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(categoryController.deleteCategory),
  );

  return router;
};
