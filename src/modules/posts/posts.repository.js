export const createPostsRepository = ({ PostsModel }) => ({
  async findById(id) {
    return PostsModel.findById(id).lean();
  },
  async findAll(query) {
    return PostsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return PostsModel.create(data);
  },
  async update(id, data) {
    return PostsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return PostsModel.findByIdAndDelete(id).lean();
  },
});
