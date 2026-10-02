export const createReactionsRepository = ({ ReactionsModel }) => ({
  async findById(id) {
    return ReactionsModel.findById(id).lean();
  },
  async findAll(query) {
    return ReactionsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return ReactionsModel.create(data);
  },
  async update(id, data) {
    return ReactionsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return ReactionsModel.findByIdAndDelete(id).lean();
  },
});
