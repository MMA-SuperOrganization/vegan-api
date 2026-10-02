export const createUsersRepository = ({ UsersModel }) => ({
  async findByFirebaseUid(firebaseUid) { return UsersModel.findOne({ firebaseUid }).lean(); },
  async findByUsername(username) { return UsersModel.findOne({ username }).lean(); },
  async updateById(id, data) { return UsersModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean(); },
  async findById(id) { return UsersModel.findById(id).lean(); },
  async findAll(query) { return UsersModel.find({}).limit(20).lean(); },
  async create(data) { return UsersModel.create(data); },
  async update(id, data) { return UsersModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean(); },
  async delete(id) { return UsersModel.findByIdAndDelete(id).lean(); }
});
