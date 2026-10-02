import { sendSuccess } from "../../common/utils/api-response.js";
export const createNotificationController = ({ notificationService }) => ({
  async getAll(req, res) {
    const items = await notificationService.getMyNotifications(req.auth.userId);
    return sendSuccess(res, { data: items });
  },
  async markAsRead(req, res) {
    const item = await notificationService.markAsRead(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { data: item });
  },
  async delete(req, res) {
    await notificationService.deleteNotification(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Notification deleted" });
  },
});
