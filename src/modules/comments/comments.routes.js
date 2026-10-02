import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createCommentsRoutes = ({ commentsController, commentsValidation }) => {
  const router = Router();
  router.get(
    "/comments",
    validate(commentsValidation.getComments),
    asyncHandler(commentsController.getComments),
  );
  router.post(
    "/comments",
    authenticate,
    validate(commentsValidation.createComment),
    asyncHandler(commentsController.createComment),
  );
  router.patch(
    "/comments/:id",
    authenticate,
    validate(commentsValidation.updateComment),
    asyncHandler(commentsController.updateComment),
  );
  router.delete(
    "/comments/:id",
    authenticate,
    validate(commentsValidation.deleteComment),
    asyncHandler(commentsController.deleteComment),
  );
  return router;
};
