import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createCategoriesRoutes = ({ categoriesController, categoriesValidation }) => {
  const router = Router();
  router.get(
    "/categories",
    validate(categoriesValidation.getCategories),
    asyncHandler(categoriesController.getCategories),
  );
  router.post(
    "/categories",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(categoriesValidation.createCategory),
    asyncHandler(categoriesController.createCategory),
  );
  router.patch(
    "/categories/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(categoriesValidation.updateCategory),
    asyncHandler(categoriesController.updateCategory),
  );
  router.delete(
    "/categories/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(categoriesValidation.deleteCategory),
    asyncHandler(categoriesController.deleteCategory),
  );
  return router;
};
