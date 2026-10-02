export const createVideosRepository = ({ VideosModel }) => ({
  async findById(id) {
    return VideosModel.findById(id).lean();
  },
  async findAll(query) {
    return VideosModel.find({}).limit(20).lean();
  },
  async create(data) {
    return VideosModel.create(data);
  },
  async update(id, data) {
    return VideosModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return VideosModel.findByIdAndDelete(id).lean();
  },
});
