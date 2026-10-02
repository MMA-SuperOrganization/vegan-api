import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createReportsRoutes = ({ reportsController, reportsValidation }) => {
  const router = Router();
  router.post(
    "/reports",
    authenticate,
    validate(reportsValidation.createReport),
    asyncHandler(reportsController.createReport),
  );
  router.get(
    "/reports/mine",
    authenticate,
    validate(reportsValidation.getMyReports),
    asyncHandler(reportsController.getMyReports),
  );
  router.get(
    "/reports/mine/:id",
    authenticate,
    validate(reportsValidation.getMyReport),
    asyncHandler(reportsController.getMyReport),
  );
  router.get(
    "/admin/reports",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(reportsValidation.getAdminReports),
    asyncHandler(reportsController.getAdminReports),
  );
  router.patch(
    "/admin/reports/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(reportsValidation.updateAdminReport),
    asyncHandler(reportsController.updateAdminReport),
  );
  return router;
};
