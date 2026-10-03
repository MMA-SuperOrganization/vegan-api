import { buildRepository } from "../../common/persistence/repository.js";
export const createWeightLogsRepository = ({ repositories = {}, WeightLogsModel }) =>
  buildRepository({ repositories, key: "weightLogs", model: WeightLogsModel });
