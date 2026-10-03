import { createRepository } from "../../common/persistence/repository.js";
import { RatingsModel } from "./ratings.model.js";
export const createRatingsRepository = ({ RatingsModel: model = RatingsModel } = {}) =>
  createRepository(model);
