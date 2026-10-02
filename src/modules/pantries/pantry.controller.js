import { sendSuccess } from "../../common/utils/api-response.js";
export const createPantryController = ({ pantryService }) => ({
  async getPantry(req, res) {
    const pantry = await pantryService.getPantry(req.auth.userId);
    return sendSuccess(res, { data: pantry });
  },
  async addItem(req, res) {
    const pantry = await pantryService.addItem(req.auth.userId, req.validated.body);
    return sendSuccess(res, { message: "Item added", data: pantry });
  },
  async updateItem(req, res) {
    const pantry = await pantryService.updateItem(
      req.auth.userId,
      req.validated.params.itemId,
      req.validated.body,
    );
    return sendSuccess(res, { message: "Item updated", data: pantry });
  },
  async removeItem(req, res) {
    const pantry = await pantryService.removeItem(req.auth.userId, req.validated.params.itemId);
    return sendSuccess(res, { message: "Item removed", data: pantry });
  },
});
