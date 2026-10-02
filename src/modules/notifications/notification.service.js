export const createNotificationService = ({ notificationRepository }) => ({
  async getMyNotifications(userId) {
    return notificationRepository.findMany(userId);
  },
  async markAsRead(userId, id) {
    return notificationRepository.markAsRead(id);
  },
  async deleteNotification(userId, id) {
    return notificationRepository.deleteById(id);
  },
});
