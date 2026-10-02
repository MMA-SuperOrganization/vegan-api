import { AppError } from "../../common/errors/app-error.js";

export const createRemindersService = ({ remindersRepository }) => ({
  async getReminders(req) {
    return await remindersRepository.findAll(req.query);
  },
  async createReminder(req) {
    return await remindersRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateReminder(req) {
    return await remindersRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteReminder(req) {
    return await remindersRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
