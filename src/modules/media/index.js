import { createMediaController } from "./media.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { MediaModel } from "./media.model.js";
import { createMediaService } from "./media.service.js";
import { createMediaValidation } from "./media.validation.js";
const buildMediaModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "mediaAssets", model: MediaModel });
  const { operations, service } = createMediaService(deps);
  return {
    operations,
    validation: createMediaValidation(),
    services: { media: service },
    repositories: { mediaAssets: deps.repositories.mediaAssets },
    models: { mediaAssets: MediaModel },
  };
};
export { MediaModel, createMediaService, createMediaValidation };

export { pendingCleanupFilter } from "./media-cleanup.js";

export const createMediaModule = (deps) => {
  const module = buildMediaModule(deps);
  return {
    ...module,
    controllers: createMediaController({ operations: module.operations, clock: deps.clock }),
  };
};
