import { sendSuccess } from "../../common/utils/api-response.js";

export const createReactionController = ({ reactionService }) => ({
  async addReaction(req, res) {
    await reactionService.addReaction(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
      req.validated.body.type,
    );
    return sendSuccess(res, { message: "Reaction added" });
  },

  async removeReaction(req, res) {
    await reactionService.removeReaction(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Reaction removed" });
  },
});
