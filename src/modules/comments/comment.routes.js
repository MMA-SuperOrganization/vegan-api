import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createCommentBodySchema, updateCommentBodySchema } from "./comment.validation.js";
import { z } from "zod";

export const createCommentRoutes = (container) => {
  const router = Router();
  const { commentController, authenticate } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });

  router.get("/", asyncHandler(commentController.getComments));

  router.post(
    "/",
    authenticate,
    validate({ body: createCommentBodySchema }),
    asyncHandler(commentController.createComment),
  );
  router.patch(
    "/:id",
    authenticate,
    validate({ params: objectIdParam, body: updateCommentBodySchema }),
    asyncHandler(commentController.updateComment),
  );
  router.delete(
    "/:id",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(commentController.deleteComment),
  );

  return router;
};
