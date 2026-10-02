import { AppError } from "../../common/errors/app-error.js";

export const createModerationService = ({ moderationCaseRepository }) => {
  return {
    async getCases(filter, options) {
      return moderationCaseRepository.findMany(filter, options);
    },

    async createCase(data, adminId) {
      return moderationCaseRepository.create({ ...data, moderatorId: adminId });
    },

    async updateCase(id, data) {
      const updated = await moderationCaseRepository.updateById(id, data);
      if (!updated) throw AppError.notFound();
      return updated;
    },

    // Mock functions for hide/restore content
    async hideContent(targetType, targetId) {
      // Connect to respective repositories in reality
      return true;
    },

    async restoreContent(targetType, targetId) {
      // Connect to respective repositories in reality
      return true;
    },
  };
};
