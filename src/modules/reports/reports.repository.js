export const createReportsRepository = ({ ReportsModel }) => ({
  async findById(id) {
    return ReportsModel.findById(id).lean();
  },
  async findAll(query) {
    return ReportsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return ReportsModel.create(data);
  },
  async update(id, data) {
    return ReportsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return ReportsModel.findByIdAndDelete(id).lean();
  },
});
