import { buildRepository } from "../../common/persistence/repository.js";
import { FoodItemsModel } from "./food-items.model.js";
import { createFoodItemsService } from "./food-items.service.js";
import { createFoodItemsValidation } from "./food-items.validation.js";
export const createFoodItemsModule = (deps) => {
  deps.repositories ??= {};
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "foodItems",
    model: FoodItemsModel,
  });
  const { operations, services } = createFoodItemsService({ deps, repository });
  return {
    operations,
    validation: createFoodItemsValidation(),
    services: { foodItems: services },
    repositories: { foodItems: repository },
    models: { foodItems: FoodItemsModel },
  };
};
export { FoodItemsModel };
