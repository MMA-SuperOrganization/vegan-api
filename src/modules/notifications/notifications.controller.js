import { sendSuccess } from "../../common/utils/api-response.js";

export const createNotificationsController = ({ notificationsService }) => ({
  async getNotifications(req, res) {
    const result = await notificationsService.getNotifications(req);
    return sendSuccess(res, { data: result || {}, message: "getNotifications success" });
  },
  async getUnreadNotificationCount(req, res) {
    const result = await notificationsService.getUnreadNotificationCount(req);
    return sendSuccess(res, { data: result || {}, message: "getUnreadNotificationCount success" });
  },
  async markNotificationAsRead(req, res) {
    const result = await notificationsService.markNotificationAsRead(req);
    return sendSuccess(res, { data: result || {}, message: "markNotificationAsRead success" });
  },
  async markAllNotificationsAsRead(req, res) {
    const result = await notificationsService.markAllNotificationsAsRead(req);
    return sendSuccess(res, { data: result || {}, message: "markAllNotificationsAsRead success" });
  },
  async deleteNotification(req, res) {
    const result = await notificationsService.deleteNotification(req);
    return sendSuccess(res, { data: result || {}, message: "deleteNotification success" });
  },
  async getNotificationPreferences(req, res) {
    const result = await notificationsService.getNotificationPreferences(req);
    return sendSuccess(res, { data: result || {}, message: "getNotificationPreferences success" });
  },
  async upsertNotificationPreferences(req, res) {
    const result = await notificationsService.upsertNotificationPreferences(req);
    return sendSuccess(res, {
      data: result || {},
      message: "upsertNotificationPreferences success",
    });
  },
});
