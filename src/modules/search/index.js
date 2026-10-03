import { buildRepository } from "../../common/persistence/repository.js";
import { SearchHistoryModel } from "./search.model.js";
import { createSearchService, searchValidation } from "./search.service.js";
export const createSearchModule = (deps) => {
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
