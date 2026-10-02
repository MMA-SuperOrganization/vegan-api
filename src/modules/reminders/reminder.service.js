export const createReminderService = ({ reminderRepository }) => ({
  async getMyReminders(userId) {
    return reminderRepository.findMany(userId);
  },
  async createReminder(userId, data) {
    return reminderRepository.create({ userId, ...data });
  },
  async updateReminder(userId, id, data) {
    return reminderRepository.updateById(id, data);
  },
  async deleteReminder(userId, id) {
    return reminderRepository.deleteById(id);
  },
});
