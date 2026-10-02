import { sendSuccess } from "../../common/utils/api-response.js";
export const createGroceryListController = ({ groceryListService }) => ({
  async getAll(req, res) {
    const lists = await groceryListService.getMyLists(req.auth.userId);
    return sendSuccess(res, { data: lists });
  },
  async getById(req, res) {
    const list = await groceryListService.getList(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { data: list });
  },
  async create(req, res) {
    const list = await groceryListService.createList(req.auth.userId, req.validated.body);
    return sendSuccess(res, { data: list });
  },
  async update(req, res) {
    const list = await groceryListService.updateList(
      req.auth.userId,
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { data: list });
  },
  async delete(req, res) {
    await groceryListService.deleteList(req.auth.userId, req.validated.params.id);
    return sendSuccess(res, { message: "Grocery list deleted" });
  },
});
