import { buildRepository } from "../../common/persistence/repository.js";
import { MediaModel } from "./media.model.js";
import { createMediaService } from "./media.service.js";
import { createMediaValidation } from "./media.validation.js";
export const createMediaModule = (deps) => {
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
