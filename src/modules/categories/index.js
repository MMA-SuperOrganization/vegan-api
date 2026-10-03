import { buildRepository } from "../../common/persistence/repository.js";
import { CategoriesModel } from "./categories.model.js";
import { createCategoriesService } from "./categories.service.js";
import { createCategoriesValidation } from "./categories.validation.js";
export const createCategoriesModule = (deps) => {
  deps.repositories ??= {};
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "categories",
    model: CategoriesModel,
  });
  const { operations, services } = createCategoriesService({ deps, repository });
  return {
    operations,
    validation: createCategoriesValidation(),
    services: { categories: services },
    repositories: { categories: repository },
    models: { categories: CategoriesModel },
  };
};
export { CategoriesModel };
