export const createRecipesRepository = ({ RecipesModel }) => ({
  async findById(id) {
    return RecipesModel.findById(id).lean();
  },
  async findAll(query) {
    return RecipesModel.find({}).limit(20).lean();
  },
  async create(data) {
    return RecipesModel.create(data);
  },
  async update(id, data) {
    return RecipesModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return RecipesModel.findByIdAndDelete(id).lean();
  },
});
