import { sendSuccess } from "../../common/utils/api-response.js";

export const createCommentsController = ({ commentsService }) => ({
  async getComments(req, res) {
    const result = await commentsService.getComments(req);
    return sendSuccess(res, { data: result || {}, message: "getComments success" });
  },
  async createComment(req, res) {
    const result = await commentsService.createComment(req);
    return sendSuccess(res, { data: result || {}, message: "createComment success" });
  },
  async updateComment(req, res) {
    const result = await commentsService.updateComment(req);
    return sendSuccess(res, { data: result || {}, message: "updateComment success" });
  },
  async deleteComment(req, res) {
    const result = await commentsService.deleteComment(req);
    return sendSuccess(res, { data: result || {}, message: "deleteComment success" });
  },
});
