import { createAiMonitoringController } from "./ai-monitoring.controller.js";
import { createAiMonitoringService, aiMonitoringValidation } from "./ai-monitoring.service.js";
const buildAiMonitoringModule = (deps) => {
  const operations = createAiMonitoringService(deps);
  return {
    operations,
    validation: aiMonitoringValidation,
    services: { aiMonitoring: { metrics: operations.getAiMetrics } },
    repositories: {},
    models: {},
  };
};

export const createAiMonitoringModule = (deps) => {
  const module = buildAiMonitoringModule(deps);
  return {
    ...module,
    controllers: createAiMonitoringController({ operations: module.operations, clock: deps.clock }),
  };
};
