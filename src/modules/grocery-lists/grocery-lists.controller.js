import { sendSuccess } from "../../common/utils/api-response.js";

export const createGroceryListsController = ({ groceryListsService }) => ({
  async getGroceryLists(req, res) {
    const result = await groceryListsService.getGroceryLists(req);
    return sendSuccess(res, { data: result || {}, message: "getGroceryLists success" });
  },
  async getGroceryList(req, res) {
    const result = await groceryListsService.getGroceryList(req);
    return sendSuccess(res, { data: result || {}, message: "getGroceryList success" });
  },
  async createGroceryList(req, res) {
    const result = await groceryListsService.createGroceryList(req);
    return sendSuccess(res, { data: result || {}, message: "createGroceryList success" });
  },
  async updateGroceryList(req, res) {
    const result = await groceryListsService.updateGroceryList(req);
    return sendSuccess(res, { data: result || {}, message: "updateGroceryList success" });
  },
  async deleteGroceryList(req, res) {
    const result = await groceryListsService.deleteGroceryList(req);
    return sendSuccess(res, { data: result || {}, message: "deleteGroceryList success" });
  },
  async addGroceryItem(req, res) {
    const result = await groceryListsService.addGroceryItem(req);
    return sendSuccess(res, { data: result || {}, message: "addGroceryItem success" });
  },
  async updateGroceryItem(req, res) {
    const result = await groceryListsService.updateGroceryItem(req);
    return sendSuccess(res, { data: result || {}, message: "updateGroceryItem success" });
  },
  async deleteGroceryItem(req, res) {
    const result = await groceryListsService.deleteGroceryItem(req);
    return sendSuccess(res, { data: result || {}, message: "deleteGroceryItem success" });
  },
  async clearCheckedGroceryItems(req, res) {
    const result = await groceryListsService.clearCheckedGroceryItems(req);
    return sendSuccess(res, { data: result || {}, message: "clearCheckedGroceryItems success" });
  },
});
