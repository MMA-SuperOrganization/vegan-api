import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAdminDashboardRoutes = ({
  adminDashboardController,
  adminDashboardValidation,
}) => {
  const router = Router();
  router.get(
    "/admin/dashboard/summary",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(adminDashboardValidation.getDashboardSummary),
    asyncHandler(adminDashboardController.getDashboardSummary),
  );
  router.get(
    "/admin/dashboard/content-trends",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(adminDashboardValidation.getContentTrends),
    asyncHandler(adminDashboardController.getContentTrends),
  );
  router.get(
    "/admin/dashboard/user-trends",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(adminDashboardValidation.getUserTrends),
    asyncHandler(adminDashboardController.getUserTrends),
  );
  router.get(
    "/admin/content/pending",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(adminDashboardValidation.getPendingContent),
    asyncHandler(adminDashboardController.getPendingContent),
  );
  return router;
};
