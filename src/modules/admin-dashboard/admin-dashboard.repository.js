export const createAdminDashboardRepository = ({ AdminDashboardModel }) => ({
  async findById(id) {
    return AdminDashboardModel.findById(id).lean();
  },
  async findAll(query) {
    return AdminDashboardModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AdminDashboardModel.create(data);
  },
  async update(id, data) {
    return AdminDashboardModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AdminDashboardModel.findByIdAndDelete(id).lean();
  },
});
