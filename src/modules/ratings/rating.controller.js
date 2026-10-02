import { sendSuccess } from "../../common/utils/api-response.js";

export const createRatingController = ({ ratingService }) => ({
  async addRating(req, res) {
    await ratingService.addRating(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
      req.validated.body.score,
      req.validated.body.review,
    );
    return sendSuccess(res, { message: "Rating added" });
  },

  async removeRating(req, res) {
    await ratingService.removeRating(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Rating removed" });
  },

  async getRatingSummary(req, res) {
    const summary = await ratingService.getRatingSummary(
      req.validated.params.targetType,
      req.validated.params.targetId,
    );
    return sendSuccess(res, { message: "Rating summary retrieved", data: summary });
  },
});
