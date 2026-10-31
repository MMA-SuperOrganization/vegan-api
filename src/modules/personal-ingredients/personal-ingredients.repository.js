import { buildRepository } from "../../common/persistence/repository.js";

export const createPersonalIngredientsRepository = ({ repositories = {}, model }) =>
  buildRepository({ repositories, key: "personalIngredients", model });
