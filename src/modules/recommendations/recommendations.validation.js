import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createRecommendationsValidation = () => ({
  discoverContent: {
    query: paginationSchema.passthrough(),
  },
  getRecipeRecommendations: {
    query: paginationSchema.passthrough(),
  },
  getContentRecommendations: {
    query: paginationSchema.passthrough(),
  },
});
