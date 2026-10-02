export const createFoodItemsRepository = ({ FoodItemsModel }) => ({
  async findById(id) {
    return FoodItemsModel.findById(id).lean();
  },
  async findAll(query) {
    return FoodItemsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return FoodItemsModel.create(data);
  },
  async update(id, data) {
    return FoodItemsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return FoodItemsModel.findByIdAndDelete(id).lean();
  },
});
