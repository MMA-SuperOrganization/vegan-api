import { Reminder } from "./reminder.model.js";
export const createReminderRepository = () => ({
  async findMany(userId) {
    return Reminder.find({ userId }).lean();
  },
  async create(data) {
    return (await new Reminder(data).save()).toObject();
  },
  async updateById(id, data) {
    return Reminder.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async deleteById(id) {
    return Reminder.findByIdAndDelete(id).lean();
  },
});
