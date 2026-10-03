import { createRepository } from "../../common/persistence/repository.js";
import { ViewHistoryModel } from "./view-history.model.js";
export const createViewHistoryRepository = ({ ViewHistoryModel: model = ViewHistoryModel } = {}) =>
  createRepository(model);
