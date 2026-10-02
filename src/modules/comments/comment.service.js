import { AppError } from "../../common/errors/app-error.js";

export const createCommentService = ({ commentRepository }) => {
  return {
    async getComments(filter, options) {
      return commentRepository.findMany({ ...filter, status: "active" }, options);
    },

    async createComment(data, userId) {
      return commentRepository.create({ ...data, authorId: userId });
    },

    async updateComment(id, data, userId) {
      const existing = await commentRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      return commentRepository.updateById(id, data);
    },

    async deleteComment(id, userId) {
      const existing = await commentRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      return commentRepository.updateById(id, { status: "deleted" });
    },
  };
};
