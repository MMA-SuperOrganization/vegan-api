import { SavedItem } from "./saved-item.model.js";

export const createSavedItemRepository = () => {
  return {
    async addItem(targetType, targetId, userId) {
      return SavedItem.findOneAndUpdate(
        { targetType, targetId, userId },
        { $setOnInsert: { targetType, targetId, userId } },
        { upsert: true, new: true },
      ).lean();
    },

    async removeItem(targetType, targetId, userId) {
      return SavedItem.findOneAndDelete({ targetType, targetId, userId }).lean();
    },

    async getSavedItems(userId, targetType, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const filter = { userId };
      if (targetType) filter.targetType = targetType;

      const [data, total] = await Promise.all([
        SavedItem.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        SavedItem.countDocuments(filter),
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
  };
};
