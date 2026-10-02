import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createGroceryListsRoutes = ({ groceryListsController, groceryListsValidation }) => {
  const router = Router();
  router.get(
    "/grocery-lists",
    authenticate,
    validate(groceryListsValidation.getGroceryLists),
    asyncHandler(groceryListsController.getGroceryLists),
  );
  router.get(
    "/grocery-lists/:id",
    authenticate,
    validate(groceryListsValidation.getGroceryList),
    asyncHandler(groceryListsController.getGroceryList),
  );
  router.post(
    "/grocery-lists",
    authenticate,
    validate(groceryListsValidation.createGroceryList),
    asyncHandler(groceryListsController.createGroceryList),
  );
  router.patch(
    "/grocery-lists/:id",
    authenticate,
    validate(groceryListsValidation.updateGroceryList),
    asyncHandler(groceryListsController.updateGroceryList),
  );
  router.delete(
    "/grocery-lists/:id",
    authenticate,
    validate(groceryListsValidation.deleteGroceryList),
    asyncHandler(groceryListsController.deleteGroceryList),
  );
  router.post(
    "/grocery-lists/:id/items",
    authenticate,
    validate(groceryListsValidation.addGroceryItem),
    asyncHandler(groceryListsController.addGroceryItem),
  );
  router.patch(
    "/grocery-lists/:id/items/:itemId",
    authenticate,
    validate(groceryListsValidation.updateGroceryItem),
    asyncHandler(groceryListsController.updateGroceryItem),
  );
  router.delete(
    "/grocery-lists/:id/items/:itemId",
    authenticate,
    validate(groceryListsValidation.deleteGroceryItem),
    asyncHandler(groceryListsController.deleteGroceryItem),
  );
  router.post(
    "/grocery-lists/:id/clear-checked",
    authenticate,
    validate(groceryListsValidation.clearCheckedGroceryItems),
    asyncHandler(groceryListsController.clearCheckedGroceryItems),
  );
  return router;
};
