import { createHomeController } from "./home.controller.js";
import { createHomeService, homeValidation } from "./home.service.js";
const buildHomeModule = (deps) => ({
  operations: createHomeService(deps),
  validation: homeValidation,
  services: {},
  repositories: {},
  models: {},
});

export const createHomeModule = (deps) => {
  const module = buildHomeModule(deps);
  return {
    ...module,
    controllers: createHomeController({ operations: module.operations, clock: deps.clock }),
  };
};
