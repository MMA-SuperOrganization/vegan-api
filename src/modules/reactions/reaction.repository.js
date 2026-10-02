import { Reaction } from "./reaction.model.js";

export const createReactionRepository = () => {
  return {
    async addReaction(targetType, targetId, userId, type) {
      return Reaction.findOneAndUpdate(
        { targetType, targetId, userId },
        { $set: { type } },
        { upsert: true, new: true },
      ).lean();
    },

    async removeReaction(targetType, targetId, userId) {
      return Reaction.findOneAndDelete({ targetType, targetId, userId }).lean();
    },

    async getReactions(targetType, targetId) {
      return Reaction.find({ targetType, targetId }).lean();
    },
  };
};
