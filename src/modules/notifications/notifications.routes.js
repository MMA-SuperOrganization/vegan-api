import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createNotificationsRoutes = ({ notificationsController, notificationsValidation }) => {
  const router = Router();
  router.get(
    "/notifications",
    authenticate,
    validate(notificationsValidation.getNotifications),
    asyncHandler(notificationsController.getNotifications),
  );
  router.get(
    "/notifications/unread-count",
    authenticate,
    validate(notificationsValidation.getUnreadNotificationCount),
    asyncHandler(notificationsController.getUnreadNotificationCount),
  );
  router.patch(
    "/notifications/:id/read",
    authenticate,
    validate(notificationsValidation.markNotificationAsRead),
    asyncHandler(notificationsController.markNotificationAsRead),
  );
  router.post(
    "/notifications/read-all",
    authenticate,
    validate(notificationsValidation.markAllNotificationsAsRead),
    asyncHandler(notificationsController.markAllNotificationsAsRead),
  );
  router.delete(
    "/notifications/:id",
    authenticate,
    validate(notificationsValidation.deleteNotification),
    asyncHandler(notificationsController.deleteNotification),
  );
  router.get(
    "/notification-preferences",
    authenticate,
    validate(notificationsValidation.getNotificationPreferences),
    asyncHandler(notificationsController.getNotificationPreferences),
  );
  router.put(
    "/notification-preferences",
    authenticate,
    validate(notificationsValidation.upsertNotificationPreferences),
    asyncHandler(notificationsController.upsertNotificationPreferences),
  );
  return router;
};
