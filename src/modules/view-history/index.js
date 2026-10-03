import { buildRepository } from "../../common/persistence/repository.js";
import { ViewHistoryModel } from "./view-history.model.js";
import { createViewHistoryService } from "./view-history.service.js";
import { createViewHistoryValidation } from "./view-history.validation.js";
export const createViewHistoryModule = (deps) => {
  buildRepository({
    repositories: deps.repositories,
    key: "viewHistories",
    model: ViewHistoryModel,
  });
  const { operations, service } = createViewHistoryService(deps);
  return {
    operations,
    validation: createViewHistoryValidation(),
    services: { history: service, viewHistory: service },
    repositories: { viewHistories: deps.repositories.viewHistories },
    models: { viewHistories: ViewHistoryModel },
  };
};
export { ViewHistoryModel, createViewHistoryService, createViewHistoryValidation };
