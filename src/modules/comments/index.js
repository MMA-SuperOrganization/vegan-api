import { buildRepository } from "../../common/persistence/repository.js";
import { CommentsModel } from "./comments.model.js";
import { createCommentsService } from "./comments.service.js";
import { createCommentsValidation } from "./comments.validation.js";
export const createCommentsModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "comments", model: CommentsModel });
  const { operations, service } = createCommentsService(deps);
  return {
    operations,
    validation: createCommentsValidation(),
    services: { comments: service },
    repositories: { comments: deps.repositories.comments },
    models: { comments: CommentsModel },
  };
};
export { CommentsModel, createCommentsService, createCommentsValidation };
