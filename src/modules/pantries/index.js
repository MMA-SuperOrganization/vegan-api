import { createPantriesController } from "./pantries.controller.js";
import { PantriesModel } from "./pantries.model.js";
import { createPantriesRepository } from "./pantries.repository.js";
import { createPantriesService } from "./pantries.service.js";
import { createPantriesValidation } from "./pantries.validation.js";
export { PantriesModel, createPantriesService, createPantriesRepository, createPantriesValidation };
function buildPantriesModule(deps = {}) {
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

export const createPantriesModule = (deps) => {
  const module = buildPantriesModule(deps);
  return {
    ...module,
    controllers: createPantriesController({ operations: module.operations, clock: deps.clock }),
  };
};
