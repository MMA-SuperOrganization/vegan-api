export const createHomeRepository = ({ HomeModel }) => ({
  async findById(id) {
    return HomeModel.findById(id).lean();
  },
  async findAll(query) {
    return HomeModel.find({}).limit(20).lean();
  },
  async create(data) {
    return HomeModel.create(data);
  },
  async update(id, data) {
    return HomeModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return HomeModel.findByIdAndDelete(id).lean();
  },
});
