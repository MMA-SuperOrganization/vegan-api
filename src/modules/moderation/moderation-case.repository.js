import { ModerationCase } from "./moderation-case.model.js";

export const createModerationCaseRepository = () => {
  return {
    async findById(id) {
      return ModerationCase.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        ModerationCase.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        ModerationCase.countDocuments(filter),
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
      const modCase = new ModerationCase(data);
      await modCase.save();
      return modCase.toObject();
    },

    async updateById(id, updateData) {
      return ModerationCase.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
