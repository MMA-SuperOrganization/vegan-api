import { AppError } from "../../common/errors/app-error.js";
export const createGroceryListService = ({ groceryListRepository }) => ({
  async getMyLists(userId) {
    return groceryListRepository.findMany({ userId });
  },
  async createList(userId, data) {
    return groceryListRepository.create({ userId, ...data });
  },
  async getList(userId, listId) {
    const list = await groceryListRepository.findById(listId);
    if (!list || String(list.userId) !== userId) throw AppError.notFound("Grocery list not found");
    return list;
  },
  async updateList(userId, listId, data) {
    const list = await this.getList(userId, listId);
    return groceryListRepository.updateById(listId, data);
  },
  async deleteList(userId, listId) {
    const list = await this.getList(userId, listId);
    return groceryListRepository.deleteById(listId);
  },
});
