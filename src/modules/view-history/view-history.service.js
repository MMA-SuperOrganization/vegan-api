import { AppError } from "../../common/errors/app-error.js";

export const createViewHistoryService = ({ viewHistoryRepository }) => ({
  async getViewHistory(req) {
    return await viewHistoryRepository.findAll(req.query);
  },
  async clearViewHistory(req) {
    return await viewHistoryRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async deleteViewHistoryItem(req) {
    return await viewHistoryRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async recordView(req) {
    return await viewHistoryRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
});
