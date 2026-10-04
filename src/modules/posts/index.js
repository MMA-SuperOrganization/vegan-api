import { createPostsController } from "./posts.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { PostsModel } from "./posts.model.js";
import { createPostsService } from "./posts.service.js";
import { createPostsValidation } from "./posts.validation.js";
const buildPostsModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "posts", model: PostsModel });
  const { operations, service } = createPostsService(deps);
  return {
    operations,
    validation: createPostsValidation(),
    services: { posts: service },
    repositories: { posts: deps.repositories.posts },
    models: { posts: PostsModel },
  };
};
export { PostsModel, createPostsService, createPostsValidation };

export const createPostsModule = (deps) => {
  const module = buildPostsModule(deps);
  return {
    ...module,
    controllers: createPostsController({ operations: module.operations, clock: deps.clock }),
  };
};
