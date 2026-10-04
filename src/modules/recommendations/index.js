import { createRecommendationsController } from "./recommendations.controller.js";
import {
  createRecommendationsService,
  recommendationValidation,
} from "./recommendations.service.js";
const buildRecommendationsModule = (deps) => {
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

export const createRecommendationsModule = (deps) => {
  const module = buildRecommendationsModule(deps);
  return {
    ...module,
    controllers: createRecommendationsController({
      operations: module.operations,
      clock: deps.clock,
    }),
  };
};
