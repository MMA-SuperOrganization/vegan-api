import {
  createRecommendationsService,
  recommendationValidation,
} from "./recommendations.service.js";
export const createRecommendationsModule = (deps) => {
  const operations = createRecommendationsService(deps);
  return {
    operations,
    validation: recommendationValidation,
    services: {
      recommendations: {
        recipes: operations.getRecipeRecommendations,
        content: operations.getContentRecommendations,
      },
    },
    repositories: {},
    models: {},
  };
};
