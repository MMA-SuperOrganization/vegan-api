import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createRatingsRoutes = ({ ratingsController, ratingsValidation }) => {
  const router = Router();
  router.put(
    "/ratings/:targetType/:targetId",
    authenticate,
    validate(ratingsValidation.upsertRating),
    asyncHandler(ratingsController.upsertRating),
  );
  router.delete(
    "/ratings/:targetType/:targetId",
    authenticate,
    validate(ratingsValidation.deleteRating),
    asyncHandler(ratingsController.deleteRating),
  );
  router.get(
    "/ratings/:targetType/:targetId/summary",
    validate(ratingsValidation.getRatingSummary),
    asyncHandler(ratingsController.getRatingSummary),
  );
  return router;
};
