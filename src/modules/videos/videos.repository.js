import { createRepository } from "../../common/persistence/repository.js";
import { VideosModel } from "./videos.model.js";
export const createVideosRepository = ({ VideosModel: model = VideosModel } = {}) =>
  createRepository(model);
