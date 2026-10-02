export const createViewHistoryRepository = ({ ViewHistoryModel }) => ({
  async findById(id) {
    return ViewHistoryModel.findById(id).lean();
  },
  async findAll(query) {
    return ViewHistoryModel.find({}).limit(20).lean();
  },
  async create(data) {
    return ViewHistoryModel.create(data);
  },
  async update(id, data) {
    return ViewHistoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return ViewHistoryModel.findByIdAndDelete(id).lean();
  },
});
