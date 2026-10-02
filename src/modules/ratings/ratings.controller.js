import { sendSuccess } from "../../common/utils/api-response.js";

export const createRatingsController = ({ ratingsService }) => ({
  async upsertRating(req, res) {
    const result = await ratingsService.upsertRating(req);
    return sendSuccess(res, { data: result || {}, message: "upsertRating success" });
  },
  async deleteRating(req, res) {
    const result = await ratingsService.deleteRating(req);
    return sendSuccess(res, { data: result || {}, message: "deleteRating success" });
  },
  async getRatingSummary(req, res) {
    const result = await ratingsService.getRatingSummary(req);
    return sendSuccess(res, { data: result || {}, message: "getRatingSummary success" });
  },
});
