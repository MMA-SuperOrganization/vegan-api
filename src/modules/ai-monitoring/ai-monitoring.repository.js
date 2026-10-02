export const createAiMonitoringRepository = ({ AiMonitoringModel }) => ({
  async findById(id) {
    return AiMonitoringModel.findById(id).lean();
  },
  async findAll(query) {
    return AiMonitoringModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AiMonitoringModel.create(data);
  },
  async update(id, data) {
    return AiMonitoringModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AiMonitoringModel.findByIdAndDelete(id).lean();
  },
});
