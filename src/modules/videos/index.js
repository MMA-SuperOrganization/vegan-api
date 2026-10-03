import { buildRepository } from "../../common/persistence/repository.js";
import { VideosModel } from "./videos.model.js";
import { createVideosService } from "./videos.service.js";
import { createVideosValidation } from "./videos.validation.js";
export const createVideosModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "videos", model: VideosModel });
  const { operations, service } = createVideosService(deps);
  return {
    operations,
    validation: createVideosValidation(),
    services: { videos: service },
    repositories: { videos: deps.repositories.videos },
    models: { videos: VideosModel },
  };
};
export { VideosModel, createVideosService, createVideosValidation };
