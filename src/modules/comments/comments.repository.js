import { createRepository } from "../../common/persistence/repository.js";
import { CommentsModel } from "./comments.model.js";
export const createCommentsRepository = ({ CommentsModel: model = CommentsModel } = {}) =>
  createRepository(model);
