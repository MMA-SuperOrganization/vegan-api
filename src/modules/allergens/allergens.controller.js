import { sendSuccess } from "../../common/utils/api-response.js";

export const createAllergensController = ({ allergensService }) => ({
  async getAllergens(req, res) {
    const result = await allergensService.getAllergens(req);
    return sendSuccess(res, { data: result || {}, message: "getAllergens success" });
  },
  async createAllergen(req, res) {
    const result = await allergensService.createAllergen(req);
    return sendSuccess(res, { data: result || {}, message: "createAllergen success" });
  },
  async updateAllergen(req, res) {
    const result = await allergensService.updateAllergen(req);
    return sendSuccess(res, { data: result || {}, message: "updateAllergen success" });
  },
  async deleteAllergen(req, res) {
    const result = await allergensService.deleteAllergen(req);
    return sendSuccess(res, { data: result || {}, message: "deleteAllergen success" });
  },
});
