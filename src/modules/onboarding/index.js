import { createOnboardingService } from "./onboarding.service.js";
import { createOnboardingValidation } from "./onboarding.validation.js";
export const createOnboardingModule = (deps) => {
  const { operations, services } = createOnboardingService(deps);
  return {
    operations,
    validation: createOnboardingValidation(),
    services: { onboarding: services },
    repositories: {},
    models: {},
  };
};
