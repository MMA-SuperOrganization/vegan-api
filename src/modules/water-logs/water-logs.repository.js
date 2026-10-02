export const createWaterLogsRepository = ({ WaterLogsModel }) => ({
  async findById(id) {
    return WaterLogsModel.findById(id).lean();
  },
  async findAll(query) {
    return WaterLogsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return WaterLogsModel.create(data);
  },
  async update(id, data) {
    return WaterLogsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return WaterLogsModel.findByIdAndDelete(id).lean();
  },
});
