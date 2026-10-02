import { sendSuccess } from "../../common/utils/api-response.js";

export const createCommentController = ({ commentService }) => ({
  async getComments(req, res) {
    const result = await commentService.getComments(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    return sendSuccess(res, { message: "Comments retrieved", ...result });
  },

  async createComment(req, res) {
    const comment = await commentService.createComment(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Comment created", data: comment }, 201);
  },

  async updateComment(req, res) {
    const comment = await commentService.updateComment(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Comment updated", data: comment });
  },

  async deleteComment(req, res) {
    await commentService.deleteComment(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Comment deleted" });
  },
});
