import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createModerationRoutes = ({ moderationController, moderationValidation }) => {
  const router = Router();
  router.get(
    "/admin/moderation-cases",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(moderationValidation.getModerationCases),
    asyncHandler(moderationController.getModerationCases),
  );
  router.post(
    "/admin/moderation-cases",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(moderationValidation.createModerationCase),
    asyncHandler(moderationController.createModerationCase),
  );
  router.patch(
    "/admin/moderation-cases/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(moderationValidation.updateModerationCase),
    asyncHandler(moderationController.updateModerationCase),
  );
  router.post(
    "/admin/moderation/:targetType/:targetId/hide",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(moderationValidation.hideContent),
    asyncHandler(moderationController.hideContent),
  );
  router.post(
    "/admin/moderation/:targetType/:targetId/restore",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(moderationValidation.restoreContent),
    asyncHandler(moderationController.restoreContent),
  );
  return router;
};
