import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createRemindersRoutes = ({ remindersController, remindersValidation }) => {
  const router = Router();
  router.get(
    "/reminders",
    authenticate,
    validate(remindersValidation.getReminders),
    asyncHandler(remindersController.getReminders),
  );
  router.post(
    "/reminders",
    authenticate,
    validate(remindersValidation.createReminder),
    asyncHandler(remindersController.createReminder),
  );
  router.patch(
    "/reminders/:id",
    authenticate,
    validate(remindersValidation.updateReminder),
    asyncHandler(remindersController.updateReminder),
  );
  router.delete(
    "/reminders/:id",
    authenticate,
    validate(remindersValidation.deleteReminder),
    asyncHandler(remindersController.deleteReminder),
  );
  return router;
};
