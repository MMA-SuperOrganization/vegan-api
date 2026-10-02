export const createDiaryRepository = ({ DiaryModel }) => ({
  async findById(id) {
    return DiaryModel.findById(id).lean();
  },
  async findAll(query) {
    return DiaryModel.find({}).limit(20).lean();
  },
  async create(data) {
    return DiaryModel.create(data);
  },
  async update(id, data) {
    return DiaryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return DiaryModel.findByIdAndDelete(id).lean();
  },
});
