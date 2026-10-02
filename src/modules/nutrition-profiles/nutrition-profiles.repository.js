export const createNutritionProfilesRepository = ({ NutritionProfilesModel }) => ({
  async findById(id) {
    return NutritionProfilesModel.findById(id).lean();
  },
  async findAll(query) {
    return NutritionProfilesModel.find({}).limit(20).lean();
  },
  async create(data) {
    return NutritionProfilesModel.create(data);
  },
  async update(id, data) {
    return NutritionProfilesModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return NutritionProfilesModel.findByIdAndDelete(id).lean();
  },
});
