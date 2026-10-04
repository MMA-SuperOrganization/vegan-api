import { createAppConfigController } from "./app-config.controller.js";
import { createAppConfigService, appConfigValidation } from "./app-config.service.js";
export * from "./discovery-support.js";
const buildAppConfigModule = (deps) => {
  const operations = createAppConfigService(deps);
  return {
    operations,
    validation: appConfigValidation,
    services: { appConfig: { getPublic: operations.getAppConfig } },
    repositories: {},
    models: {},
  };
};

export const createAppConfigModule = (deps) => {
  const module = buildAppConfigModule(deps);
  return {
    ...module,
    controllers: createAppConfigController({ operations: module.operations, clock: deps.clock }),
  };
};
