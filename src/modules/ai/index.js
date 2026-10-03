import { createAiRepository } from "./ai.repository.js";
import { createAiService } from "./ai.service.js";
import { createAiValidation } from "./ai.validation.js";
import { aiModels } from "./ai.model.js";
import { createAiProvider } from "../../providers/ai/ai.provider.js";
export function createAiModule(deps = {}) {
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
