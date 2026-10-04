import { createAdminDashboardController } from "./admin-dashboard.controller.js";
import { createAdminDashboardService, dashboardValidation } from "./admin-dashboard.service.js";
const buildAdminDashboardModule = (deps) => ({
  operations: createAdminDashboardService(deps),
  validation: dashboardValidation,
  services: {},
  repositories: {},
  models: {},
});

export const createAdminDashboardModule = (deps) => {
  const module = buildAdminDashboardModule(deps);
  return {
    ...module,
    controllers: createAdminDashboardController({
      operations: module.operations,
      clock: deps.clock,
    }),
  };
};
