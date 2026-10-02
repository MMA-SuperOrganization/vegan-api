import { sendSuccess } from "../../common/utils/api-response.js";

export const createReactionsController = ({ reactionsService }) => ({
  async upsertReaction(req, res) {
    const result = await reactionsService.upsertReaction(req);
    return sendSuccess(res, { data: result || {}, message: "upsertReaction success" });
  },
  async deleteReaction(req, res) {
    const result = await reactionsService.deleteReaction(req);
    return sendSuccess(res, { data: result || {}, message: "deleteReaction success" });
  },
});
