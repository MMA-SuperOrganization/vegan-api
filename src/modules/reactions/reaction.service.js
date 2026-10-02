export const createReactionService = ({ reactionRepository }) => {
  return {
    async addReaction(targetType, targetId, userId, type) {
      return reactionRepository.addReaction(targetType, targetId, userId, type);
    },

    async removeReaction(targetType, targetId, userId) {
      return reactionRepository.removeReaction(targetType, targetId, userId);
    },
  };
};
