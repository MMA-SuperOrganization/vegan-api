export const createRemindersRepository = ({ RemindersModel }) => ({
  async findById(id) {
    return RemindersModel.findById(id).lean();
  },
  async findAll(query) {
    return RemindersModel.find({}).limit(20).lean();
  },
  async create(data) {
    return RemindersModel.create(data);
  },
  async update(id, data) {
    return RemindersModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return RemindersModel.findByIdAndDelete(id).lean();
  },
});
