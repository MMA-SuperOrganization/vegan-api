export const createRecommendationsRepository = ({ RecommendationsModel }) => ({
  async findById(id) {
    return RecommendationsModel.findById(id).lean();
  },
  async findAll(query) {
    return RecommendationsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return RecommendationsModel.create(data);
  },
  async update(id, data) {
    return RecommendationsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return RecommendationsModel.findByIdAndDelete(id).lean();
  },
});
