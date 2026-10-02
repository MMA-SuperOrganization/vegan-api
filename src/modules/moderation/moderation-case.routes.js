import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import {
  createModerationCaseBodySchema,
  updateModerationCaseBodySchema,
} from "./moderation-case.validation.js";
import { z } from "zod";

export const createModerationRoutes = (container) => {
  const router = Router();
  const { moderationController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const targetParams = z.object({
    targetType: z.enum(["recipe", "post", "video", "comment", "user"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  });

  const requireAdmin = authorize("admin");

  router.use(authenticate, requireAdmin);

  router.get("/", asyncHandler(moderationController.getCases));
  router.post(
    "/",
    validate({ body: createModerationCaseBodySchema }),
    asyncHandler(moderationController.createCase),
  );
  router.patch(
    "/:id",
    validate({ params: objectIdParam, body: updateModerationCaseBodySchema }),
    asyncHandler(moderationController.updateCase),
  );

  router.post(
    "/:targetType/:targetId/hide",
    validate({ params: targetParams }),
    asyncHandler(moderationController.hideContent),
  );
  router.post(
    "/:targetType/:targetId/restore",
    validate({ params: targetParams }),
    asyncHandler(moderationController.restoreContent),
  );

  return router;
};
