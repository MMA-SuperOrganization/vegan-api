import { WeightLog } from "./weight-log.model.js";
export const createWeightLogRepository = () => ({
  async findMany(filter) {
    return WeightLog.find(filter).sort({ recordedAt: -1 }).lean();
  },
  async findById(id) {
    return WeightLog.findById(id).lean();
  },
  async create(data) {
    return (await new WeightLog(data).save()).toObject();
  },
  async updateById(id, data) {
    return WeightLog.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async deleteById(id) {
    return WeightLog.findByIdAndDelete(id).lean();
  },
});
