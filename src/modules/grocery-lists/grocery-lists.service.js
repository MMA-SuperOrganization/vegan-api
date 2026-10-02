import { AppError } from "../../common/errors/app-error.js";

export const createGroceryListsService = ({ groceryListsRepository }) => ({
  async getGroceryLists(req) {
    return await groceryListsRepository.findAll(req.query);
  },
  async getGroceryList(req) {
    return await groceryListsRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createGroceryList(req) {
    return await groceryListsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateGroceryList(req) {
    return await groceryListsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteGroceryList(req) {
    return await groceryListsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async addGroceryItem(req) {
    return await groceryListsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateGroceryItem(req) {
    return await groceryListsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteGroceryItem(req) {
    return await groceryListsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async clearCheckedGroceryItems(req) {
    return await groceryListsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
