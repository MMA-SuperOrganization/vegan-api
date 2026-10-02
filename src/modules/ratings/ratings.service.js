import { AppError } from "../../common/errors/app-error.js";

export const createRatingsService = ({ ratingsRepository }) => ({
  async upsertRating(req) {
    return await ratingsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteRating(req) {
    return await ratingsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async getRatingSummary(req) {
    return await ratingsRepository.findAll(req.query);
  },
});
