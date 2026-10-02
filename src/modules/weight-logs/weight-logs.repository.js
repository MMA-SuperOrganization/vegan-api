export const createWeightLogsRepository = ({ WeightLogsModel }) => ({
  async findById(id) {
    return WeightLogsModel.findById(id).lean();
  },
  async findAll(query) {
    return WeightLogsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return WeightLogsModel.create(data);
  },
  async update(id, data) {
    return WeightLogsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return WeightLogsModel.findByIdAndDelete(id).lean();
  },
});
