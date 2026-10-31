import { createPersonalIngredientsController } from "./personal-ingredients.controller.js";
import { PersonalIngredientsModel } from "./personal-ingredients.model.js";
import { createPersonalIngredientsRepository } from "./personal-ingredients.repository.js";
import { createPersonalIngredientsService } from "./personal-ingredients.service.js";
import { createPersonalIngredientsValidation } from "./personal-ingredients.validation.js";

export { PersonalIngredientsModel };

export const createPersonalIngredientsModule = (deps = {}) => {
  const repository = createPersonalIngredientsRepository({
    repositories: deps.repositories ?? {},
    model: PersonalIngredientsModel,
  });
  const service = createPersonalIngredientsService({
    repository,
    services: deps.services,
  });
  const module = {
    operations: service.operations,
    validation: createPersonalIngredientsValidation(),
    services: { personalIngredients: service.publicService },
    repositories: { personalIngredients: repository },
    models: { personalIngredients: PersonalIngredientsModel },
  };
  return {
    ...module,
    controllers: createPersonalIngredientsController({
      operations: module.operations,
      clock: deps.clock,
    }),
  };
};
