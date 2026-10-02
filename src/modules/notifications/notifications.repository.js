export const createNotificationsRepository = ({ NotificationsModel }) => ({
  async findById(id) {
    return NotificationsModel.findById(id).lean();
  },
  async findAll(query) {
    return NotificationsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return NotificationsModel.create(data);
  },
  async update(id, data) {
    return NotificationsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return NotificationsModel.findByIdAndDelete(id).lean();
  },
});
