import { createRepository } from "../../common/persistence/repository.js";
import { MediaModel } from "./media.model.js";
export const createMediaRepository = ({ MediaModel: model = MediaModel } = {}) =>
  createRepository(model);
