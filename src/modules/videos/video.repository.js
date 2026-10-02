import { Video } from "./video.model.js";

export const createVideoRepository = () => {
  return {
    async findById(id) {
      return Video.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Video.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Video.countDocuments(filter),
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
      const video = new Video(data);
      await video.save();
      return video.toObject();
    },

    async updateById(id, updateData) {
      return Video.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
