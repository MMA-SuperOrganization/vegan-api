import { createModerationController } from "./moderation.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { ModerationModel } from "./moderation.model.js";
import { createModerationService, moderationValidation } from "./moderation.service.js";
const buildModerationModule = (deps) => {
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "moderation",
    model: ModerationModel,
  });
  return {
    operations: createModerationService(deps, repository),
    validation: moderationValidation,
    services: {},
    repositories: { moderation: repository },
    models: { moderation: ModerationModel },
  };
};

export const createModerationModule = (deps) => {
  const module = buildModerationModule(deps);
  return {
    ...module,
    controllers: createModerationController({ operations: module.operations, clock: deps.clock }),
  };
};
