import { PantriesModel } from "./pantries.model.js";
import { createPantriesRepository } from "./pantries.repository.js";
import { createPantriesService } from "./pantries.service.js";
import { createPantriesValidation } from "./pantries.validation.js";
export { PantriesModel, createPantriesService, createPantriesRepository, createPantriesValidation };
export function createPantriesModule(deps = {}) {
  const repository = createPantriesRepository({
    repositories: deps.repositories ?? {},
    PantriesModel,
  });
  const service = createPantriesService({ ...deps, pantriesRepository: repository });
  return {
    operations: service.operations,
    validation: createPantriesValidation(),
    services: { pantries: service.publicService },
    repositories: { pantries: repository },
    models: { PantriesModel },
  };
}
