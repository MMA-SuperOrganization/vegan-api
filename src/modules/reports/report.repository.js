import { Report } from "./report.model.js";

export const createReportRepository = () => {
  return {
    async findById(id) {
      return Report.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Report.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Report.countDocuments(filter),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async create(data) {
      const report = new Report(data);
      await report.save();
      return report.toObject();
    },

    async updateById(id, updateData) {
      return Report.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
