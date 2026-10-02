import { WaterLog } from "./water-log.model.js";
export const createWaterLogRepository = () => ({
  async findMany(filter) {
    return WaterLog.find(filter).sort({ recordedAt: -1 }).lean();
  },
  async findById(id) {
    return WaterLog.findById(id).lean();
  },
  async create(data) {
    return (await new WaterLog(data).save()).toObject();
  },
  async updateById(id, data) {
    return WaterLog.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async deleteById(id) {
    return WaterLog.findByIdAndDelete(id).lean();
  },
});
