import { createRatingsController } from "./ratings.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { RatingsModel } from "./ratings.model.js";
import { createRatingsService } from "./ratings.service.js";
import { createRatingsValidation } from "./ratings.validation.js";
const buildRatingsModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "ratings", model: RatingsModel });
  const { operations, service } = createRatingsService(deps);
  return {
    operations,
    validation: createRatingsValidation(),
    services: { ratings: service },
    repositories: { ratings: deps.repositories.ratings },
    models: { ratings: RatingsModel },
  };
};
export { RatingsModel, createRatingsService, createRatingsValidation };

export const createRatingsModule = (deps) => {
  const module = buildRatingsModule(deps);
  return {
    ...module,
    controllers: createRatingsController({ operations: module.operations, clock: deps.clock }),
  };
};
