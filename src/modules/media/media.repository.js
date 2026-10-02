export const createMediaRepository = ({ MediaModel }) => ({
  async findById(id) {
    return MediaModel.findById(id).lean();
  },
  async findAll(query) {
    return MediaModel.find({}).limit(20).lean();
  },
  async create(data) {
    return MediaModel.create(data);
  },
  async update(id, data) {
    return MediaModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return MediaModel.findByIdAndDelete(id).lean();
  },
});
