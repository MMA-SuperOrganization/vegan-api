import { AppError } from "../../common/errors/app-error.js";

export const createAllergensService = ({ allergensRepository }) => ({
  async getAllergens(req) {
    return await allergensRepository.findAll(req.query);
  },
  async createAllergen(req) {
    return await allergensRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateAllergen(req) {
    return await allergensRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteAllergen(req) {
    return await allergensRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
