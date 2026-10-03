import { createRepository } from "../../common/persistence/repository.js";
import { ReactionsModel } from "./reactions.model.js";
export const createReactionsRepository = ({ ReactionsModel: model = ReactionsModel } = {}) =>
  createRepository(model);
