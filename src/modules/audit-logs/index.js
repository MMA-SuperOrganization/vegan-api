import { createAuditLogsController } from "./audit-logs.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { AuditLogsModel } from "./audit-logs.model.js";
import {
  createAuditService,
  createAuditLogsService,
  auditValidation,
} from "./audit-logs.service.js";
export { createAuditService, sanitizeAudit } from "./audit-logs.service.js";
const buildAuditLogsModule = (deps) => {
  const repository = buildRepository({
    repositories: deps.repositories,
    key: "auditLogs",
    model: AuditLogsModel,
  });
  const audit = createAuditService({ repository, clock: deps.clock });
  return {
    operations: createAuditLogsService(deps, repository),
    validation: auditValidation,
    services: { audit },
    repositories: { auditLogs: repository },
    models: { auditLogs: AuditLogsModel },
  };
};

export const createAuditLogsModule = (deps) => {
  const module = buildAuditLogsModule(deps);
  return {
    ...module,
    controllers: createAuditLogsController({ operations: module.operations, clock: deps.clock }),
  };
};
