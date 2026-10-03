import { buildRepository } from "../../common/persistence/repository.js";
import { PostsModel } from "./posts.model.js";
import { createPostsService } from "./posts.service.js";
import { createPostsValidation } from "./posts.validation.js";
export const createPostsModule = (deps) => {
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
