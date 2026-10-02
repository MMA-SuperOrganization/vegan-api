import { AppError } from "../../common/errors/app-error.js";

export const createSavedItemsService = ({ savedItemsRepository }) => ({
  async getSavedItems(req) {
    return await savedItemsRepository.findAll(req.query);
  },
  async saveItem(req) {
    return await savedItemsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async unsaveItem(req) {
    return await savedItemsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
