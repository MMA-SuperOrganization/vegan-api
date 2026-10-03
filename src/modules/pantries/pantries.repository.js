import { buildRepository } from "../../common/persistence/repository.js";
export const createPantriesRepository = ({ repositories = {}, PantriesModel }) =>
  buildRepository({ repositories, key: "pantries", model: PantriesModel });
