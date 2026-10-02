export const createCommentsRepository = ({ CommentsModel }) => ({
  async findById(id) {
    return CommentsModel.findById(id).lean();
  },
  async findAll(query) {
    return CommentsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return CommentsModel.create(data);
  },
  async update(id, data) {
    return CommentsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return CommentsModel.findByIdAndDelete(id).lean();
  },
});
