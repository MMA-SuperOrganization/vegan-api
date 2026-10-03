import { MealPlansModel, MealPlanActiveSlotsModel } from "./meal-plans.model.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { createMealPlansRepository } from "./meal-plans.repository.js";
import { createMealPlansService } from "./meal-plans.service.js";
import { createMealPlansValidation } from "./meal-plans.validation.js";
export {
  MealPlansModel,
  MealPlanActiveSlotsModel,
  createMealPlansService,
  createMealPlansRepository,
  createMealPlansValidation,
};
export function createMealPlansModule(deps = {}) {
  const repository = createMealPlansRepository({
    repositories: deps.repositories ?? {},
    MealPlansModel,
  });
  const slots = buildRepository({
    repositories: deps.repositories ?? {},
    key: "mealPlanActiveSlots",
    model: MealPlanActiveSlotsModel,
  });
  const service = createMealPlansService({
    ...deps,
    mealPlansRepository: repository,
    mealPlanActiveSlotsRepository: slots,
  });
  return {
    operations: service.operations,
    validation: createMealPlansValidation(),
    services: { mealPlans: service.publicService },
    repositories: { mealPlans: repository, mealPlanActiveSlots: slots },
    models: { MealPlansModel, MealPlanActiveSlotsModel },
  };
}
