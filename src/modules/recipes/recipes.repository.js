import { createRepository } from "../../common/persistence/repository.js";
import { RecipesModel } from "./recipes.model.js";
export const createRecipesRepository = ({ RecipesModel: model = RecipesModel } = {}) =>
  createRepository(model);
