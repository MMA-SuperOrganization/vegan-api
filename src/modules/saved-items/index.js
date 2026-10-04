import { createSavedItemsController } from "./saved-items.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { SavedItemsModel } from "./saved-items.model.js";
import { createSavedItemsService } from "./saved-items.service.js";
import { createSavedItemsValidation } from "./saved-items.validation.js";
const buildSavedItemsModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "savedItems", model: SavedItemsModel });
  const { operations, service } = createSavedItemsService(deps);
  return {
    operations,
    validation: createSavedItemsValidation(),
    services: { savedItems: service },
    repositories: { savedItems: deps.repositories.savedItems },
    models: { savedItems: SavedItemsModel },
  };
};
export { SavedItemsModel, createSavedItemsService, createSavedItemsValidation };

export const createSavedItemsModule = (deps) => {
  const module = buildSavedItemsModule(deps);
  return {
    ...module,
    controllers: createSavedItemsController({ operations: module.operations, clock: deps.clock }),
  };
};
