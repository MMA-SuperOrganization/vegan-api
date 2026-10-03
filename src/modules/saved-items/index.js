import { buildRepository } from "../../common/persistence/repository.js";
import { SavedItemsModel } from "./saved-items.model.js";
import { createSavedItemsService } from "./saved-items.service.js";
import { createSavedItemsValidation } from "./saved-items.validation.js";
export const createSavedItemsModule = (deps) => {
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
