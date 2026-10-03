import { buildRepository } from "../../common/persistence/repository.js";
export const createGroceryListsRepository = ({ repositories = {}, GroceryListsModel }) =>
  buildRepository({ repositories, key: "groceryLists", model: GroceryListsModel });
