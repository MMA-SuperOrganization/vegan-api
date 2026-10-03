import { createAdminDashboardService, dashboardValidation } from "./admin-dashboard.service.js";
export const createAdminDashboardModule = (deps) => ({
  operations: createAdminDashboardService(deps),
  validation: dashboardValidation,
  services: {},
  repositories: {},
  models: {},
});
