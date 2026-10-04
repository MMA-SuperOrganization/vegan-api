import { createGroceryListsController } from "./grocery-lists.controller.js";
import { GroceryListsModel } from "./grocery-lists.model.js";
import { createGroceryListsRepository } from "./grocery-lists.repository.js";
import { createGroceryListsService } from "./grocery-lists.service.js";
import { createGroceryListsValidation } from "./grocery-lists.validation.js";
export {
  GroceryListsModel,
  createGroceryListsService,
  createGroceryListsRepository,
  createGroceryListsValidation,
};
function buildGroceryListsModule(deps = {}) {
  const repository = createGroceryListsRepository({
    repositories: deps.repositories ?? {},
    GroceryListsModel,
  });
  const service = createGroceryListsService({ ...deps, groceryListsRepository: repository });
  return {
    operations: service.operations,
    validation: createGroceryListsValidation(),
    services: { groceryLists: service.publicService },
    repositories: { groceryLists: repository },
    models: { GroceryListsModel },
  };
}

export const createGroceryListsModule = (deps) => {
  const module = buildGroceryListsModule(deps);
  return {
    ...module,
    controllers: createGroceryListsController({ operations: module.operations, clock: deps.clock }),
  };
};
