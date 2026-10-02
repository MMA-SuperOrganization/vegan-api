import { sendSuccess } from "../../common/utils/api-response.js";

export const createRemindersController = ({ remindersService }) => ({
  async getReminders(req, res) {
    const result = await remindersService.getReminders(req);
    return sendSuccess(res, { data: result || {}, message: "getReminders success" });
  },
  async createReminder(req, res) {
    const result = await remindersService.createReminder(req);
    return sendSuccess(res, { data: result || {}, message: "createReminder success" });
  },
  async updateReminder(req, res) {
    const result = await remindersService.updateReminder(req);
    return sendSuccess(res, { data: result || {}, message: "updateReminder success" });
  },
  async deleteReminder(req, res) {
    const result = await remindersService.deleteReminder(req);
    return sendSuccess(res, { data: result || {}, message: "deleteReminder success" });
  },
});
