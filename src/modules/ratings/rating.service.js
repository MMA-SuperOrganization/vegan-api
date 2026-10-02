export const createRatingService = ({ ratingRepository }) => {
  return {
    async addRating(targetType, targetId, userId, score, review) {
      return ratingRepository.addRating(targetType, targetId, userId, score, review);
    },

    async removeRating(targetType, targetId, userId) {
      return ratingRepository.removeRating(targetType, targetId, userId);
    },

    async getRatingSummary(targetType, targetId) {
      return ratingRepository.getRatingSummary(targetType, targetId);
    },
  };
};
