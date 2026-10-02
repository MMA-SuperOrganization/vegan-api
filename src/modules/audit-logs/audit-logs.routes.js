import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAuditLogsRoutes = ({ auditLogsController, auditLogsValidation }) => {
  const router = Router();
  router.get(
    "/admin/audit-logs",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(auditLogsValidation.getAuditLogs),
    asyncHandler(auditLogsController.getAuditLogs),
  );
  return router;
};
