export const createOnboardingRepository = ({ OnboardingModel }) => ({
  async findById(id) {
    return OnboardingModel.findById(id).lean();
  },
  async findAll(query) {
    return OnboardingModel.find({}).limit(20).lean();
  },
  async create(data) {
    return OnboardingModel.create(data);
  },
  async update(id, data) {
    return OnboardingModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return OnboardingModel.findByIdAndDelete(id).lean();
  },
});
