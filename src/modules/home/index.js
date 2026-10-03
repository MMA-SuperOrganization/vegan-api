import { createHomeService, homeValidation } from "./home.service.js";
export const createHomeModule = (deps) => ({
  operations: createHomeService(deps),
  validation: homeValidation,
  services: {},
  repositories: {},
  models: {},
});
