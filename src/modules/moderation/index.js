import { buildRepository } from "../../common/persistence/repository.js";
import { ModerationModel } from "./moderation.model.js";
import { createModerationService, moderationValidation } from "./moderation.service.js";
export const createModerationModule = (deps) => {
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
