export const createSavedItemsRepository = ({ SavedItemsModel }) => ({
  async findById(id) {
    return SavedItemsModel.findById(id).lean();
  },
  async findAll(query) {
    return SavedItemsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return SavedItemsModel.create(data);
  },
  async update(id, data) {
    return SavedItemsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return SavedItemsModel.findByIdAndDelete(id).lean();
  },
});
