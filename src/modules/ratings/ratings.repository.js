export const createRatingsRepository = ({ RatingsModel }) => ({
  async findById(id) {
    return RatingsModel.findById(id).lean();
  },
  async findAll(query) {
    return RatingsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return RatingsModel.create(data);
  },
  async update(id, data) {
    return RatingsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return RatingsModel.findByIdAndDelete(id).lean();
  },
});
