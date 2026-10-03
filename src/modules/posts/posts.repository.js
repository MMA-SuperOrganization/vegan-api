import { createRepository } from "../../common/persistence/repository.js";
import { PostsModel } from "./posts.model.js";
export const createPostsRepository = ({ PostsModel: model = PostsModel } = {}) =>
  createRepository(model);
