import { buildRepository } from "../../common/persistence/repository.js";
export const createWaterLogsRepository = ({ repositories = {}, WaterLogsModel }) =>
  buildRepository({ repositories, key: "waterLogs", model: WaterLogsModel });
