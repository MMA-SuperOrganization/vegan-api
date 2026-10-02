import { sendSuccess } from "../../common/utils/api-response.js";

export const createRecommendationController = ({ recommendationService }) => ({
  async getDiscoverFeed(req, res) {
    const data = await recommendationService.getDiscoverFeed(req.auth?.userId);
    return sendSuccess(res, { message: "Discover feed retrieved", data });
  },

  async getRecipeRecommendations(req, res) {
    const data = await recommendationService.getRecipeRecommendations(req.auth.userId);
    return sendSuccess(res, { message: "Recipe recommendations retrieved", data });
  },

  async getContentRecommendations(req, res) {
    const data = await recommendationService.getContentRecommendations(req.auth.userId);
    return sendSuccess(res, { message: "Content recommendations retrieved", data });
  },
});
