import { sendSuccess } from "../../common/utils/api-response.js";

export const createVideoController = ({ videoService }) => ({
  async getVideos(req, res) {
    const result = await videoService.getVideos(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Videos retrieved", ...result });
  },

  async getMyVideos(req, res) {
    const filter = { ...req.query.filter, authorId: req.auth.userId };
    const result = await videoService.getVideos(filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "My videos retrieved", ...result });
  },

  async getVideo(req, res) {
    const video = await videoService.getVideo(req.validated.params.idOrSlug);
    return sendSuccess(res, { message: "Video retrieved", data: video });
  },

  async createVideo(req, res) {
    const video = await videoService.createVideo(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Video created", data: video }, 201);
  },

  async updateVideo(req, res) {
    const video = await videoService.updateVideo(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Video updated", data: video });
  },

  async deleteVideo(req, res) {
    await videoService.deleteVideo(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Video deleted" });
  },

  async submitVideo(req, res) {
    await videoService.submitVideo(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Video submitted for review" });
  },

  // Admin
  async publishVideo(req, res) {
    await videoService.publishVideo(req.validated.params.id);
    return sendSuccess(res, { message: "Video published" });
  },

  async rejectVideo(req, res) {
    await videoService.rejectVideo(req.validated.params.id, req.body.reason);
    return sendSuccess(res, { message: "Video rejected" });
  },
});
