import { sendSuccess } from "../../common/utils/api-response.js";

export const createAllergenController = ({ allergenService }) => ({
  async getAllergens(req, res) {
    const allergens = await allergenService.getAllergens(req.query);
    return sendSuccess(res, { message: "Allergens retrieved", data: allergens });
  },

  async createAllergen(req, res) {
    const allergen = await allergenService.createAllergen(req.validated.body);
    return sendSuccess(res, { message: "Allergen created", data: allergen }, 201);
  },

  async updateAllergen(req, res) {
    const allergen = await allergenService.updateAllergen(
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, { message: "Allergen updated", data: allergen });
  },

  async deleteAllergen(req, res) {
    await allergenService.deleteAllergen(req.validated.params.id);
    return sendSuccess(res, { message: "Allergen deactivated" });
  },
});
