import { buildRepository } from "../../common/persistence/repository.js";
import { aiModels } from "./ai.model.js";
export const createAiRepository = ({ repositories = {} } = {}) =>
  Object.fromEntries(
    Object.entries(aiModels).map(([key, model]) => [
      key,
      buildRepository({ repositories, key, model }),
    ]),
  );
