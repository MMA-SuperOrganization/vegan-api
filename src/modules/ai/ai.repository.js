export const createAiRepository = ({ AiModel }) => ({
  async findById(id) {
    return AiModel.findById(id).lean();
  },
  async findAll(query) {
    return AiModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AiModel.create(data);
  },
  async update(id, data) {
    return AiModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AiModel.findByIdAndDelete(id).lean();
  },
});
