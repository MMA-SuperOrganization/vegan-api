import { createAuthController } from "./auth.controller.js";
import { createAuthService } from "./auth.service.js";
import { createAuthValidation } from "./auth.validation.js";
const buildAuthModule = (deps) => ({
  operations: createAuthService(deps),
  validation: createAuthValidation(),
  services: {},
  repositories: {},
  models: {},
});

export const createAuthModule = (deps) => {
  const module = buildAuthModule(deps);
  return {
    ...module,
    controllers: createAuthController({ operations: module.operations, clock: deps.clock }),
  };
};
