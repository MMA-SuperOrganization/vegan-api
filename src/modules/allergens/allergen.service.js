import { AppError } from "../../common/errors/app-error.js";

export const createAllergenService = ({ allergenRepository }) => {
  return {
    async getAllergens(filter, options) {
      return allergenRepository.findMany(filter, options);
    },

    async createAllergen(data) {
      return allergenRepository.create(data);
    },

    async updateAllergen(id, data) {
      const updated = await allergenRepository.updateById(id, data);
      if (!updated) throw AppError.notFound("Allergen not found");
      return updated;
    },

    async deleteAllergen(id) {
      const updated = await allergenRepository.updateById(id, { status: "inactive" });
      if (!updated) throw AppError.notFound("Allergen not found");
      return updated;
    },
  };
};
