import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createReactionsRoutes = ({ reactionsController, reactionsValidation }) => {
  const router = Router();
  router.put(
    "/reactions/:targetType/:targetId",
    authenticate,
    validate(reactionsValidation.upsertReaction),
    asyncHandler(reactionsController.upsertReaction),
  );
  router.delete(
    "/reactions/:targetType/:targetId",
    authenticate,
    validate(reactionsValidation.deleteReaction),
    asyncHandler(reactionsController.deleteReaction),
  );
  return router;
};
