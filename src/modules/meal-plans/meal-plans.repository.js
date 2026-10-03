import { buildRepository } from "../../common/persistence/repository.js";
export const createMealPlansRepository = ({ repositories = {}, MealPlansModel }) =>
  buildRepository({ repositories, key: "mealPlans", model: MealPlansModel });
