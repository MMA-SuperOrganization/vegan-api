import { buildRepository } from "../../common/persistence/repository.js";
import { AllergensModel } from "./allergens.model.js";
import { createAllergensService } from "./allergens.service.js";
import { createAllergensValidation } from "./allergens.validation.js";
export const createAllergensModule = (deps) => {
  deps.repositories ??= {};
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "allergens",
    model: AllergensModel,
  });
  const { operations, services } = createAllergensService({ deps, repository });
  return {
    operations,
    validation: createAllergensValidation(),
    services: { allergens: services },
    repositories: { allergens: repository },
    models: { allergens: AllergensModel },
  };
};
export { AllergensModel };
