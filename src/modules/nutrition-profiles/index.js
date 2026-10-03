import { buildRepository } from "../../common/persistence/repository.js";
import { NutritionProfilesModel } from "./nutrition-profiles.model.js";
import { createNutritionProfilesService } from "./nutrition-profiles.service.js";
import { createNutritionProfilesValidation } from "./nutrition-profiles.validation.js";
export const createNutritionProfilesModule = (deps) => {
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
