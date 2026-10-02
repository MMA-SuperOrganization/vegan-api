import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { addReactionBodySchema } from "./reaction.validation.js";
import { z } from "zod";

export const createReactionRoutes = (container) => {
  const router = Router();
  const { reactionController, authenticate } = container;

  const targetParams = z.object({
    targetType: z.enum(["recipe", "post", "video", "comment"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  });

  router.put(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams, body: addReactionBodySchema }),
    asyncHandler(reactionController.addReaction),
  );
  router.delete(
    "/:targetType/:targetId",
    authenticate,
    validate({ params: targetParams }),
    asyncHandler(reactionController.removeReaction),
  );

  return router;
};
