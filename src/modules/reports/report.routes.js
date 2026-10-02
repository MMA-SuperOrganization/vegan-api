import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createReportBodySchema, updateReportBodySchema } from "./report.validation.js";
import { z } from "zod";

export const createReportRoutes = (container) => {
  const router = Router();
  const { reportController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const requireAdmin = authorize("admin");

  // User
  router.post(
    "/",
    authenticate,
    validate({ body: createReportBodySchema }),
    asyncHandler(reportController.createReport),
  );
  router.get("/mine", authenticate, asyncHandler(reportController.getMyReports));
  router.get(
    "/mine/:id",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(reportController.getMyReportDetail),
  );

  // Admin (Mounting under /admin/reports in index.js)
  router.get("/admin", authenticate, requireAdmin, asyncHandler(reportController.getReports));
  router.patch(
    "/admin/:id",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam, body: updateReportBodySchema }),
    asyncHandler(reportController.updateReport),
  );

  return router;
};
