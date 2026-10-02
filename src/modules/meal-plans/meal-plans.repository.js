export const createMealPlansRepository = ({ MealPlansModel }) => ({
  async findById(id) {
    return MealPlansModel.findById(id).lean();
  },
  async findAll(query) {
    return MealPlansModel.find({}).limit(20).lean();
  },
  async create(data) {
    return MealPlansModel.create(data);
  },
  async update(id, data) {
    return MealPlansModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return MealPlansModel.findByIdAndDelete(id).lean();
  },
});
