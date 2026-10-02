export const createAuditLogsRepository = ({ AuditLogsModel }) => ({
  async findById(id) {
    return AuditLogsModel.findById(id).lean();
  },
  async findAll(query) {
    return AuditLogsModel.find({}).limit(20).lean();
  },
  async create(data) {
    return AuditLogsModel.create(data);
  },
  async update(id, data) {
    return AuditLogsModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },
  async delete(id) {
    return AuditLogsModel.findByIdAndDelete(id).lean();
  },
});
