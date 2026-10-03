import { createRepository } from "../../common/persistence/repository.js";
import { SavedItemsModel } from "./saved-items.model.js";
export const createSavedItemsRepository = ({ SavedItemsModel: model = SavedItemsModel } = {}) =>
  createRepository(model);
