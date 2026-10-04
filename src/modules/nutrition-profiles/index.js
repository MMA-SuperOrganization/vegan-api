import { createNutritionProfilesController } from "./nutrition-profiles.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { NutritionProfilesModel } from "./nutrition-profiles.model.js";
import { createNutritionProfilesService } from "./nutrition-profiles.service.js";
import { createNutritionProfilesValidation } from "./nutrition-profiles.validation.js";
const buildNutritionProfilesModule = (deps) => {
  deps.repositories ??= {};
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "nutritionProfiles",
    model: NutritionProfilesModel,
  });
  const { operations, services } = createNutritionProfilesService({ deps, repository });
  return {
    operations,
    validation: createNutritionProfilesValidation(),
    services: { nutritionProfiles: services },
    repositories: { nutritionProfiles: repository },
    models: { nutritionProfiles: NutritionProfilesModel },
  };
};
export { NutritionProfilesModel };

export const createNutritionProfilesModule = (deps) => {
  const module = buildNutritionProfilesModule(deps);
  return {
    ...module,
    controllers: createNutritionProfilesController({
      operations: module.operations,
      clock: deps.clock,
    }),
  };
};
