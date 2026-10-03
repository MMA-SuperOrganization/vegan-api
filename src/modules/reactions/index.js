import { buildRepository } from "../../common/persistence/repository.js";
import { ReactionsModel } from "./reactions.model.js";
import { createReactionsService } from "./reactions.service.js";
import { createReactionsValidation } from "./reactions.validation.js";
export const createReactionsModule = (deps) => {
  buildRepository({ repositories: deps.repositories, key: "reactions", model: ReactionsModel });
  const { operations, service } = createReactionsService(deps);
  return {
    operations,
    validation: createReactionsValidation(),
    services: { interactions: service, reactions: service },
    repositories: { reactions: deps.repositories.reactions },
    models: { reactions: ReactionsModel },
  };
};
export { ReactionsModel, createReactionsService, createReactionsValidation };
