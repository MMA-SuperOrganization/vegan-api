import { createAllergensController } from "./allergens.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { AllergensModel } from "./allergens.model.js";
import { createAllergensService } from "./allergens.service.js";
import { createAllergensValidation } from "./allergens.validation.js";
const buildAllergensModule = (deps) => {
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

export const createAllergensModule = (deps) => {
  const module = buildAllergensModule(deps);
  return {
    ...module,
    controllers: createAllergensController({ operations: module.operations, clock: deps.clock }),
  };
};
