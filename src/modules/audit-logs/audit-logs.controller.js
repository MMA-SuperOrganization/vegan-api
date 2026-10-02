import { sendSuccess } from "../../common/utils/api-response.js";

export const createAuditLogsController = ({ auditLogsService }) => ({
  async getAuditLogs(req, res) {
    const result = await auditLogsService.getAuditLogs(req);
    return sendSuccess(res, { data: result || {}, message: "getAuditLogs success" });
  },
});
