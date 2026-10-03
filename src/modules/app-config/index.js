import { createAppConfigService, appConfigValidation } from "./app-config.service.js";
export * from "./discovery-support.js";
export const createAppConfigModule = (deps) => {
  const operations = createAppConfigService(deps);
  return {
    operations,
    validation: appConfigValidation,
    services: { appConfig: { getPublic: operations.getAppConfig } },
    repositories: {},
    models: {},
  };
};
