import { sendSuccess } from "../../common/utils/api-response.js";

export const createModerationController = ({ moderationService }) => ({
  async getCases(req, res) {
    const result = await moderationService.getCases(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Moderation cases retrieved", ...result });
  },

  async createCase(req, res) {
    const modCase = await moderationService.createCase(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Moderation case created", data: modCase }, 201);
  },

  async updateCase(req, res) {
    const modCase = await moderationService.updateCase(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: "Moderation case updated", data: modCase });
  },

  async hideContent(req, res) {
    await moderationService.hideContent(
      req.validated.params.targetType,
      req.validated.params.targetId,
    );
    return sendSuccess(res, { message: "Content hidden" });
  },

  async restoreContent(req, res) {
    await moderationService.restoreContent(
      req.validated.params.targetType,
      req.validated.params.targetId,
    );
    return sendSuccess(res, { message: "Content restored" });
  },
});
