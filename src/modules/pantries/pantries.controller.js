import { sendSuccess } from "../../common/utils/api-response.js";

export const createPantriesController = ({ pantriesService }) => ({
  async getPantry(req, res) {
    const result = await pantriesService.getPantry(req);
    return sendSuccess(res, { data: result || {}, message: "getPantry success" });
  },
  async addPantryItem(req, res) {
    const result = await pantriesService.addPantryItem(req);
    return sendSuccess(res, { data: result || {}, message: "addPantryItem success" });
  },
  async addPantryItemsBulk(req, res) {
    const result = await pantriesService.addPantryItemsBulk(req);
    return sendSuccess(res, { data: result || {}, message: "addPantryItemsBulk success" });
  },
  async updatePantryItem(req, res) {
    const result = await pantriesService.updatePantryItem(req);
    return sendSuccess(res, { data: result || {}, message: "updatePantryItem success" });
  },
  async deletePantryItem(req, res) {
    const result = await pantriesService.deletePantryItem(req);
    return sendSuccess(res, { data: result || {}, message: "deletePantryItem success" });
  },
  async getExpiringPantryItems(req, res) {
    const result = await pantriesService.getExpiringPantryItems(req);
    return sendSuccess(res, { data: result || {}, message: "getExpiringPantryItems success" });
  },
  async getPantryRecipeSuggestions(req, res) {
    const result = await pantriesService.getPantryRecipeSuggestions(req);
    return sendSuccess(res, { data: result || {}, message: "getPantryRecipeSuggestions success" });
  },
});
