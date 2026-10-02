import { sendSuccess } from "../../common/utils/api-response.js";

export const createRecommendationsController = ({ recommendationsService }) => ({
  async discoverContent(req, res) {
    const result = await recommendationsService.discoverContent(req);
    return sendSuccess(res, { data: result || {}, message: "discoverContent success" });
  },
  async getRecipeRecommendations(req, res) {
    const result = await recommendationsService.getRecipeRecommendations(req);
    return sendSuccess(res, { data: result || {}, message: "getRecipeRecommendations success" });
  },
  async getContentRecommendations(req, res) {
    const result = await recommendationsService.getContentRecommendations(req);
    return sendSuccess(res, { data: result || {}, message: "getContentRecommendations success" });
  },
});
