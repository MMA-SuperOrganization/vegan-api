export const createAllergensRepository = ({ AllergensModel }) => ({
  async findById(id) {
    return AllergensModel.findById(id).lean();
  },
  async findAll(query) {
    return AllergensModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AllergensModel.create(data);
  },
  async update(id, data) {
    return AllergensModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AllergensModel.findByIdAndDelete(id).lean();
  },
});
