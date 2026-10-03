import { WaterLogsModel } from "./water-logs.model.js";
import { createWaterLogsRepository } from "./water-logs.repository.js";
import { createWaterLogsService } from "./water-logs.service.js";
import { createWaterLogsValidation } from "./water-logs.validation.js";
export {
  WaterLogsModel,
  createWaterLogsService,
  createWaterLogsRepository,
  createWaterLogsValidation,
};
export function createWaterLogsModule(deps = {}) {
  const repository = createWaterLogsRepository({
    repositories: deps.repositories ?? {},
    WaterLogsModel,
  });
  const service = createWaterLogsService({ ...deps, waterLogsRepository: repository });
  return {
    operations: service.operations,
    validation: createWaterLogsValidation(),
    services: { waterLogs: service.publicService },
    repositories: { waterLogs: repository },
    models: { WaterLogsModel },
  };
}
