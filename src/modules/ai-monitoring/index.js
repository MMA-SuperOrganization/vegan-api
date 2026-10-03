import { createAiMonitoringService, aiMonitoringValidation } from "./ai-monitoring.service.js";
export const createAiMonitoringModule = (deps) => {
  const operations = createAiMonitoringService(deps);
  return {
    operations,
    validation: aiMonitoringValidation,
    services: { aiMonitoring: { metrics: operations.getAiMetrics } },
    repositories: {},
    models: {},
  };
};
