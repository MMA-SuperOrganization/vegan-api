import { AppError } from "../../common/errors/app-error.js";

export const createPantriesService = ({ pantriesRepository }) => ({
  async getPantry(req) {
    return await pantriesRepository.findAll(req.query);
  },
  async addPantryItem(req) {
    return await pantriesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async addPantryItemsBulk(req) {
    return await pantriesRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updatePantryItem(req) {
    return await pantriesRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deletePantryItem(req) {
    return await pantriesRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async getExpiringPantryItems(req) {
    return await pantriesRepository.findAll(req.query);
  },
  async getPantryRecipeSuggestions(req) {
    return await pantriesRepository.findAll(req.query);
  },
});
