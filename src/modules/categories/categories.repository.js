export const createCategoriesRepository = ({ CategoriesModel }) => ({
  async findById(id) {
    return CategoriesModel.findById(id).lean();
  },
  async findAll(query) {
    return CategoriesModel.find({}).limit(20).lean();
  },
  async create(data) {
    return CategoriesModel.create(data);
  },
  async update(id, data) {
    return CategoriesModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return CategoriesModel.findByIdAndDelete(id).lean();
  },
});
