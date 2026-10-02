export const createAppConfigRepository = ({ AppConfigModel }) => ({
  async findById(id) {
    return AppConfigModel.findById(id).lean();
  },
  async findAll(query) {
    return AppConfigModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AppConfigModel.create(data);
  },
  async update(id, data) {
    return AppConfigModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AppConfigModel.findByIdAndDelete(id).lean();
  },
});
