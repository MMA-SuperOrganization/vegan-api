import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createPostsRoutes = ({ postsController, postsValidation }) => {
  const router = Router();
  router.get("/posts", validate(postsValidation.getPosts), asyncHandler(postsController.getPosts));
  router.get(
    "/posts/mine",
    authenticate,
    validate(postsValidation.getMyPosts),
    asyncHandler(postsController.getMyPosts),
  );
  router.get(
    "/posts/:id",
    optionalAuthenticate,
    validate(postsValidation.getPost),
    asyncHandler(postsController.getPost),
  );
  router.post(
    "/posts",
    authenticate,
    validate(postsValidation.createPost),
    asyncHandler(postsController.createPost),
  );
  router.patch(
    "/posts/:id",
    authenticate,
    validate(postsValidation.updatePost),
    asyncHandler(postsController.updatePost),
  );
  router.delete(
    "/posts/:id",
    authenticate,
    validate(postsValidation.deletePost),
    asyncHandler(postsController.deletePost),
  );
  router.post(
    "/posts/:id/submit",
    authenticate,
    validate(postsValidation.submitPost),
    asyncHandler(postsController.submitPost),
  );
  router.post(
    "/posts/:id/publish",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(postsValidation.publishPost),
    asyncHandler(postsController.publishPost),
  );
  router.post(
    "/posts/:id/reject",
    authenticate,
    authorize(ROLES.ADMIN),
    validate(postsValidation.rejectPost),
    asyncHandler(postsController.rejectPost),
  );
  return router;
};
