export const createSavedItemService = ({ savedItemRepository }) => {
  return {
    async addItem(targetType, targetId, userId) {
      return savedItemRepository.addItem(targetType, targetId, userId);
    },

    async removeItem(targetType, targetId, userId) {
      return savedItemRepository.removeItem(targetType, targetId, userId);
    },

    async getSavedItems(userId, targetType, options) {
      return savedItemRepository.getSavedItems(userId, targetType, options);
    },
  };
};
