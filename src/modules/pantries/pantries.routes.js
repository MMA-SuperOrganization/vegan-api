import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createPantriesRoutes = ({ pantriesController, pantriesValidation }) => {
  const router = Router();
  router.get(
    "/pantry",
    authenticate,
    validate(pantriesValidation.getPantry),
    asyncHandler(pantriesController.getPantry),
  );
  router.post(
    "/pantry/items",
    authenticate,
    validate(pantriesValidation.addPantryItem),
    asyncHandler(pantriesController.addPantryItem),
  );
  router.post(
    "/pantry/items/bulk",
    authenticate,
    validate(pantriesValidation.addPantryItemsBulk),
    asyncHandler(pantriesController.addPantryItemsBulk),
  );
  router.patch(
    "/pantry/items/:itemId",
    authenticate,
    validate(pantriesValidation.updatePantryItem),
    asyncHandler(pantriesController.updatePantryItem),
  );
  router.delete(
    "/pantry/items/:itemId",
    authenticate,
    validate(pantriesValidation.deletePantryItem),
    asyncHandler(pantriesController.deletePantryItem),
  );
  router.get(
    "/pantry/expiring",
    authenticate,
    validate(pantriesValidation.getExpiringPantryItems),
    asyncHandler(pantriesController.getExpiringPantryItems),
  );
  router.get(
    "/pantry/recipe-suggestions",
    authenticate,
    validate(pantriesValidation.getPantryRecipeSuggestions),
    asyncHandler(pantriesController.getPantryRecipeSuggestions),
  );
  return router;
};
