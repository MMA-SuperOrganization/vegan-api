export const createPantriesRepository = ({ PantriesModel }) => ({
  async findById(id) {
    return PantriesModel.findById(id).lean();
  },
  async findAll(query) {
    return PantriesModel.find({}).limit(20).lean();
  },
  async create(data) {
    return PantriesModel.create(data);
  },
  async update(id, data) {
    return PantriesModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return PantriesModel.findByIdAndDelete(id).lean();
  },
});
