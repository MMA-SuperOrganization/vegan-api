import { createAiController } from "./ai.controller.js";
import { createAiRepository } from "./ai.repository.js";
import { createAiService } from "./ai.service.js";
import { createAiValidation } from "./ai.validation.js";
import { aiModels } from "./ai.model.js";
import { createAiProvider } from "../../providers/ai/ai.provider.js";
function buildAiModule(deps = {}) {
  const repositories = createAiRepository(deps);
  const service = createAiService({
    ...deps,
    aiRepository: repositories,
    aiProvider:
      deps.aiProvider ??
      createAiProvider({ env: deps.env, logger: deps.logger, clock: deps.clock }),
  });
  return {
    operations: service,
    validation: createAiValidation(),
    services: { ai: service },
    models: aiModels,
    repositories,
  };
}
export { createAiService, createAiValidation, createAiRepository };
export * from "./ai.model.js";

export { chatOutput, mealPlanOutput, pantryOutput, summaryOutput } from "./ai.validation.js";

export const createAiModule = (deps) => {
  const module = buildAiModule(deps);
  return {
    ...module,
    controllers: createAiController({ operations: module.operations, clock: deps.clock }),
  };
};
