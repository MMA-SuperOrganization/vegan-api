import { sendSuccess } from "../../common/utils/api-response.js";
export const createReminderController = ({ reminderService }) => ({
  async getAll(req, res) {
    const items = await reminderService.getMyReminders(req.auth.userId);
    return sendSuccess(res, { data: items });
  },
  async create(req, res) {
    const item = await reminderService.createReminder(req.auth.userId, req.validated.body);
    return sendSuccess(res, { data: item });
  },
  async update(req, res) {
    const item = await reminderService.updateReminder(
      req.auth.userId,
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { data: item });
  },
  async delete(req, res) {
    await reminderService.deleteReminder(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Reminder deleted" });
  },
});
