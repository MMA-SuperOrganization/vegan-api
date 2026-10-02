import { AppError } from "../../common/errors/app-error.js";

export const createAuditLogsService = ({ auditLogsRepository }) => ({
  async getAuditLogs(req) {
    return await auditLogsRepository.findAll(req.query);
  },
});
