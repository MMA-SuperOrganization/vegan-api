import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";

export const createSavedItemRoutes = (container) => {
  const router = Router();
  const { savedItemController, authenticate } = container;

  const targetParams = z.object({
    targetType: z.enum(["recipe", "post", "video"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  });

  router.get("/", authenticate, asyncHandler(savedItemController.getSavedItems));
  router.put(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams }),
    asyncHandler(savedItemController.saveItem),
  );
  router.delete(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams }),
    asyncHandler(savedItemController.unsaveItem),
  );

  return router;
};
