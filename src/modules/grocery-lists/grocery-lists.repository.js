export const createGroceryListsRepository = ({ GroceryListsModel }) => ({
  async findById(id) {
    return GroceryListsModel.findById(id).lean();
  },
  async findAll(query) {
    return GroceryListsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return GroceryListsModel.create(data);
  },
  async update(id, data) {
    return GroceryListsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return GroceryListsModel.findByIdAndDelete(id).lean();
  },
});
