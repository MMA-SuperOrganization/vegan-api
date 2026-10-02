import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createViewHistoryRoutes = ({ viewHistoryController, viewHistoryValidation }) => {
  const router = Router();
  router.get(
    "/view-history",
    authenticate,
    validate(viewHistoryValidation.getViewHistory),
    asyncHandler(viewHistoryController.getViewHistory),
  );
  router.delete(
    "/view-history",
    authenticate,
    validate(viewHistoryValidation.clearViewHistory),
    asyncHandler(viewHistoryController.clearViewHistory),
  );
  router.delete(
    "/view-history/:targetType/:targetId",
    authenticate,
    validate(viewHistoryValidation.deleteViewHistoryItem),
    asyncHandler(viewHistoryController.deleteViewHistoryItem),
  );
  router.put(
    "/view-history/:targetType/:targetId",
    authenticate,
    validate(viewHistoryValidation.recordView),
    asyncHandler(viewHistoryController.recordView),
  );
  return router;
};
