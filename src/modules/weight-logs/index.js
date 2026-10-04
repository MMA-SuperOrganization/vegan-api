import { createWeightLogsController } from "./weight-logs.controller.js";
import { WeightLogsModel } from "./weight-logs.model.js";
import { createWeightLogsRepository } from "./weight-logs.repository.js";
import { createWeightLogsService } from "./weight-logs.service.js";
import { createWeightLogsValidation } from "./weight-logs.validation.js";
export {
  WeightLogsModel,
  createWeightLogsService,
  createWeightLogsRepository,
  createWeightLogsValidation,
};
function buildWeightLogsModule(deps = {}) {
  const repository = createWeightLogsRepository({
    repositories: deps.repositories ?? {},
    WeightLogsModel,
  });
  const service = createWeightLogsService({ ...deps, weightLogsRepository: repository });
  return {
    operations: service.operations,
    validation: createWeightLogsValidation(),
    services: { weightLogs: service.publicService },
    repositories: { weightLogs: repository },
    models: { WeightLogsModel },
  };
}

export const createWeightLogsModule = (deps) => {
  const module = buildWeightLogsModule(deps);
  return {
    ...module,
    controllers: createWeightLogsController({ operations: module.operations, clock: deps.clock }),
  };
};
