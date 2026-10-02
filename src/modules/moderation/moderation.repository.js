export const createModerationRepository = ({ ModerationModel }) => ({
  async findById(id) {
    return ModerationModel.findById(id).lean();
  },
  async findAll(query) {
    return ModerationModel.find({}).limit(20).lean();
  },
  async create(data) {
    return ModerationModel.create(data);
  },
  async update(id, data) {
    return ModerationModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return ModerationModel.findByIdAndDelete(id).lean();
  },
});
