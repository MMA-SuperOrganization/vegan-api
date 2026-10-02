import { AppError } from "../../common/errors/app-error.js";

export const createRecommendationsService = ({ recommendationsRepository }) => ({
  async discoverContent(req) {
    return await recommendationsRepository.findAll(req.query);
  },
  async getRecipeRecommendations(req) {
    return await recommendationsRepository.findAll(req.query);
  },
  async getContentRecommendations(req) {
    return await recommendationsRepository.findAll(req.query);
  },
});
