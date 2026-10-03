import { buildRepository } from "../../common/persistence/repository.js";
import { ReportsModel } from "./reports.model.js";
import { createReportsService, reportsValidation } from "./reports.service.js";
export { reportStatuses, validateAssignee, validateTransition } from "./reports.service.js";
export const createReportsModule = (deps) => {
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
