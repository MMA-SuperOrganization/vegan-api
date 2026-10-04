import { createReportsController } from "./reports.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { ReportsModel } from "./reports.model.js";
import { createReportsService, reportsValidation } from "./reports.service.js";
export { reportStatuses, validateAssignee, validateTransition } from "./reports.service.js";
const buildReportsModule = (deps) => {
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "reports",
    model: ReportsModel,
  });
  return {
    operations: createReportsService(deps, repository),
    validation: reportsValidation,
    services: {},
    repositories: { reports: repository },
    models: { reports: ReportsModel },
  };
};

export const createReportsModule = (deps) => {
  const module = buildReportsModule(deps);
  return {
    ...module,
    controllers: createReportsController({ operations: module.operations, clock: deps.clock }),
  };
};
