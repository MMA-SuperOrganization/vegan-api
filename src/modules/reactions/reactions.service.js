import { AppError } from "../../common/errors/app-error.js";

export const createReactionsService = ({ reactionsRepository }) => ({
  async upsertReaction(req) {
    return await reactionsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteReaction(req) {
    return await reactionsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
