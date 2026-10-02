import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAllergensRoutes = ({ allergensController, allergensValidation }) => {
  const router = Router();
  router.get(
    "/allergens",
    validate(allergensValidation.getAllergens),
    asyncHandler(allergensController.getAllergens),
  );
  router.post(
    "/allergens",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(allergensValidation.createAllergen),
    asyncHandler(allergensController.createAllergen),
  );
  router.patch(
    "/allergens/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(allergensValidation.updateAllergen),
    asyncHandler(allergensController.updateAllergen),
  );
  router.delete(
    "/allergens/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(allergensValidation.deleteAllergen),
    asyncHandler(allergensController.deleteAllergen),
  );
  return router;
};
