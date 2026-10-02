import { Rating } from "./rating.model.js";

export const createRatingRepository = () => {
  return {
    async addRating(targetType, targetId, userId, score, review) {
      return Rating.findOneAndUpdate(
        { targetType, targetId, userId },
        { $set: { score, review } },
        { upsert: true, new: true },
      ).lean();
    },

    async removeRating(targetType, targetId, userId) {
      return Rating.findOneAndDelete({ targetType, targetId, userId }).lean();
    },

    async getRatings(targetType, targetId, options = {}) {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Rating.find({ targetType, targetId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Rating.countDocuments({ targetType, targetId }),
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

    async getRatingSummary(targetType, targetId) {
      const result = await Rating.aggregate([
        { $match: { targetType, targetId } },
        { $group: { _id: null, averageScore: { $avg: "$score" }, totalRatings: { $sum: 1 } } },
      ]);
      return result[0] || { averageScore: 0, totalRatings: 0 };
    },
  };
};
