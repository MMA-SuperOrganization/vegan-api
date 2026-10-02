import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createSavedItemsRoutes = ({ savedItemsController, savedItemsValidation }) => {
  const router = Router();
  router.get(
    "/saved-items",
    authenticate,
    validate(savedItemsValidation.getSavedItems),
    asyncHandler(savedItemsController.getSavedItems),
  );
  router.put(
    "/saved-items/:targetType/:targetId",
    authenticate,
    validate(savedItemsValidation.saveItem),
    asyncHandler(savedItemsController.saveItem),
  );
  router.delete(
    "/saved-items/:targetType/:targetId",
    authenticate,
    validate(savedItemsValidation.unsaveItem),
    asyncHandler(savedItemsController.unsaveItem),
  );
  return router;
};
