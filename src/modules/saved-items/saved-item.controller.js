import { sendSuccess } from "../../common/utils/api-response.js";

export const createSavedItemController = ({ savedItemService }) => ({
  async getSavedItems(req, res) {
    const result = await savedItemService.getSavedItems(req.auth.userId, req.query.targetType, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Saved items retrieved", ...result });
  },

  async saveItem(req, res) {
    await savedItemService.addItem(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Item saved" });
  },

  async unsaveItem(req, res) {
    await savedItemService.removeItem(
      req.validated.params.targetType,
      req.validated.params.targetId,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Item unsaved" });
  },
});
