import { createSearchController } from "./search.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { SearchHistoryModel } from "./search.model.js";
import { createSearchService, searchValidation } from "./search.service.js";
const buildSearchModule = (deps) => {
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "searchHistory",
    model: SearchHistoryModel,
  });
  return {
    operations: createSearchService(deps, repository),
    validation: searchValidation,
    services: {},
    repositories: { searchHistory: repository },
    models: { searchHistory: SearchHistoryModel },
  };
};

export const createSearchModule = (deps) => {
  const module = buildSearchModule(deps);
  return {
    ...module,
    controllers: createSearchController({ operations: module.operations, clock: deps.clock }),
  };
};
