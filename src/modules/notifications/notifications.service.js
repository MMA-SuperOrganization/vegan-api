import { AppError } from "../../common/errors/app-error.js";

export const createNotificationsService = ({ notificationsRepository }) => ({
  async getNotifications(req) {
    return await notificationsRepository.findAll(req.query);
  },
  async getUnreadNotificationCount(req) {
    return await notificationsRepository.findAll(req.query);
  },
  async markNotificationAsRead(req) {
    return await notificationsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async markAllNotificationsAsRead(req) {
    return await notificationsRepository.create({
      ...req.validated.body,
      userId: req.auth?.userId,
    });
  },
  async deleteNotification(req) {
    return await notificationsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async getNotificationPreferences(req) {
    return await notificationsRepository.findAll(req.query);
  },
  async upsertNotificationPreferences(req) {
    return await notificationsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
});
