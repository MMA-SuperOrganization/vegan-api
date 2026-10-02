import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { createPostBodySchema, updatePostBodySchema } from "./post.validation.js";
import { z } from "zod";

export const createPostRoutes = (container) => {
  const router = Router();
  const { postController, authenticate, authorize } = container;

  const objectIdParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId") });
  const requireAdmin = authorize("admin");

  router.get("/", asyncHandler(postController.getPosts));
  router.get("/mine", authenticate, asyncHandler(postController.getMyPosts));
  router.get("/:id", validate({ params: objectIdParam }), asyncHandler(postController.getPost));

  router.post(
    "/",
    authenticate,
    validate({ body: createPostBodySchema }),
    asyncHandler(postController.createPost),
  );
  router.patch(
    "/:id",
    authenticate,
    validate({ params: objectIdParam, body: updatePostBodySchema }),
    asyncHandler(postController.updatePost),
  );
  router.delete(
    "/:id",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(postController.deletePost),
  );

  router.post(
    "/:id/submit",
    authenticate,
    validate({ params: objectIdParam }),
    asyncHandler(postController.submitPost),
  );

  router.post(
    "/:id/publish",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(postController.publishPost),
  );
  router.post(
    "/:id/reject",
    authenticate,
    requireAdmin,
    validate({ params: objectIdParam }),
    asyncHandler(postController.rejectPost),
  );

  return router;
};
