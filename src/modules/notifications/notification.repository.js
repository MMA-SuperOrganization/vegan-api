import { Notification } from "./notification.model.js";
export const createNotificationRepository = () => ({
  async findMany(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  },
  async markAsRead(id) {
    return Notification.findByIdAndUpdate(
      id,
      { status: "read", readAt: new Date() },
      { new: true },
    ).lean();
  },
  async deleteById(id) {
    return Notification.findByIdAndDelete(id).lean();
  },
});
