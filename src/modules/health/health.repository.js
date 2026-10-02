export const createHealthRepository = ({ HealthModel }) => ({
  async findById(id) {
    return HealthModel.findById(id).lean();
  },
  async findAll(query) {
    return HealthModel.find({}).limit(20).lean();
  },
  async create(data) {
    return HealthModel.create(data);
  },
  async update(id, data) {
    return HealthModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return HealthModel.findByIdAndDelete(id).lean();
  },
});
