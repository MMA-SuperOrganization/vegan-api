import { createFoodItemsController } from "./food-items.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { FoodItemsModel } from "./food-items.model.js";
import { createFoodItemsService } from "./food-items.service.js";
import { createFoodItemsValidation } from "./food-items.validation.js";
const buildFoodItemsModule = (deps) => {
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

export const createFoodItemsModule = (deps) => {
  const module = buildFoodItemsModule(deps);
  return {
    ...module,
    controllers: createFoodItemsController({ operations: module.operations, clock: deps.clock }),
  };
};
