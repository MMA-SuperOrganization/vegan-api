export const createAuthRepository = ({ AuthModel }) => ({
  async findById(id) {
    return AuthModel.findById(id).lean();
  },
  async findAll(query) {
    return AuthModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AuthModel.create(data);
  },
  async update(id, data) {
    return AuthModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AuthModel.findByIdAndDelete(id).lean();
  },
});
