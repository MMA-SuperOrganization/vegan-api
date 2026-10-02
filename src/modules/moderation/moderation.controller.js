import { sendSuccess } from "../../common/utils/api-response.js";

export const createModerationController = ({ moderationService }) => ({
  async getModerationCases(req, res) {
    const result = await moderationService.getModerationCases(req);
    return sendSuccess(res, { data: result || {}, message: "getModerationCases success" });
  },
  async createModerationCase(req, res) {
    const result = await moderationService.createModerationCase(req);
    return sendSuccess(res, { data: result || {}, message: "createModerationCase success" });
  },
  async updateModerationCase(req, res) {
    const result = await moderationService.updateModerationCase(req);
    return sendSuccess(res, { data: result || {}, message: "updateModerationCase success" });
  },
  async hideContent(req, res) {
    const result = await moderationService.hideContent(req);
    return sendSuccess(res, { data: result || {}, message: "hideContent success" });
  },
  async restoreContent(req, res) {
    const result = await moderationService.restoreContent(req);
    return sendSuccess(res, { data: result || {}, message: "restoreContent success" });
  },
});
