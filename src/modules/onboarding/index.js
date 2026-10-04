import { createOnboardingController } from "./onboarding.controller.js";
import { createOnboardingService } from "./onboarding.service.js";
import { createOnboardingValidation } from "./onboarding.validation.js";
const buildOnboardingModule = (deps) => {
  const { operations, services } = createOnboardingService(deps);
  return {
    operations,
    validation: createOnboardingValidation(),
    services: { onboarding: services },
    repositories: {},
    models: {},
  };
};

export const createOnboardingModule = (deps) => {
  const module = buildOnboardingModule(deps);
  return {
    ...module,
    controllers: createOnboardingController({ operations: module.operations, clock: deps.clock }),
  };
};
