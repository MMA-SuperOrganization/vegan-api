import { AppError } from "../../common/errors/app-error.js";

export const createCommentsService = ({ commentsRepository }) => ({
  async getComments(req) {
    return await commentsRepository.findAll(req.query);
  },
  async createComment(req) {
    return await commentsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateComment(req) {
    return await commentsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteComment(req) {
    return await commentsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
