import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createDiaryRoutes = ({ diaryController, diaryValidation }) => {
  const router = Router();
  router.get(
    "/diary",
    authenticate,
    validate(diaryValidation.getDiaryEntries),
    asyncHandler(diaryController.getDiaryEntries),
  );
  router.post(
    "/diary",
    authenticate,
    validate(diaryValidation.createDiaryEntry),
    asyncHandler(diaryController.createDiaryEntry),
  );
  router.patch(
    "/diary/:id",
    authenticate,
    validate(diaryValidation.updateDiaryEntry),
    asyncHandler(diaryController.updateDiaryEntry),
  );
  router.delete(
    "/diary/:id",
    authenticate,
    validate(diaryValidation.deleteDiaryEntry),
    asyncHandler(diaryController.deleteDiaryEntry),
  );
  router.get(
    "/diary/summary",
    authenticate,
    validate(diaryValidation.getDiarySummary),
    asyncHandler(diaryController.getDiarySummary),
  );
  return router;
};
