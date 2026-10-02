export const createSearchRepository = ({ SearchModel }) => ({
  async findById(id) {
    return SearchModel.findById(id).lean();
  },
  async findAll(query) {
    return SearchModel.find({}).limit(20).lean();
  },
  async create(data) {
    return SearchModel.create(data);
  },
  async update(id, data) {
    return SearchModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return SearchModel.findByIdAndDelete(id).lean();
  },
});
