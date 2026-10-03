import { createAuthService } from "./auth.service.js";
import { createAuthValidation } from "./auth.validation.js";
export const createAuthModule = (deps) => ({
  operations: createAuthService(deps),
  validation: createAuthValidation(),
  services: {},
  repositories: {},
  models: {},
});
