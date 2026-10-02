import { sendSuccess } from "../../common/utils/api-response.js";

export const createSavedItemsController = ({ savedItemsService }) => ({
  async getSavedItems(req, res) {
    const result = await savedItemsService.getSavedItems(req);
    return sendSuccess(res, { data: result || {}, message: "getSavedItems success" });
  },
  async saveItem(req, res) {
    const result = await savedItemsService.saveItem(req);
    return sendSuccess(res, { data: result || {}, message: "saveItem success" });
  },
  async unsaveItem(req, res) {
    const result = await savedItemsService.unsaveItem(req);
    return sendSuccess(res, { data: result || {}, message: "unsaveItem success" });
  },
});
