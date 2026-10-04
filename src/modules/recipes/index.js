import { createRecipesController } from "./recipes.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { RecipesModel } from "./recipes.model.js";
import { createRecipesService } from "./recipes.service.js";
import { createRecipesValidation } from "./recipes.validation.js";
import { createContentFacade } from "../../common/content-service.js";
const buildRecipesModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "recipes", model: RecipesModel });
  const { operations, service } = createRecipesService(deps);
  return {
    operations,
    validation: createRecipesValidation(),
    services: { recipes: service, content: createContentFacade(deps) },
    repositories: { recipes: deps.repositories.recipes },
    models: { recipes: RecipesModel },
  };
};
export { RecipesModel, createRecipesService, createRecipesValidation };

export * from "../../common/content-service.js";

export const createRecipesModule = (deps) => {
  const module = buildRecipesModule(deps);
  return {
    ...module,
    controllers: createRecipesController({ operations: module.operations, clock: deps.clock }),
  };
};
