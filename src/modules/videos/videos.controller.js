import { sendSuccess } from "../../common/utils/api-response.js";

export const createVideosController = ({ videosService }) => ({
  async getVideos(req, res) {
    const result = await videosService.getVideos(req);
    return sendSuccess(res, { data: result || {}, message: "getVideos success" });
  },
  async getMyVideos(req, res) {
    const result = await videosService.getMyVideos(req);
    return sendSuccess(res, { data: result || {}, message: "getMyVideos success" });
  },
  async getVideo(req, res) {
    const result = await videosService.getVideo(req);
    return sendSuccess(res, { data: result || {}, message: "getVideo success" });
  },
  async createVideo(req, res) {
    const result = await videosService.createVideo(req);
    return sendSuccess(res, { data: result || {}, message: "createVideo success" });
  },
  async updateVideo(req, res) {
    const result = await videosService.updateVideo(req);
    return sendSuccess(res, { data: result || {}, message: "updateVideo success" });
  },
  async deleteVideo(req, res) {
    const result = await videosService.deleteVideo(req);
    return sendSuccess(res, { data: result || {}, message: "deleteVideo success" });
  },
  async submitVideo(req, res) {
    const result = await videosService.submitVideo(req);
    return sendSuccess(res, { data: result || {}, message: "submitVideo success" });
  },
  async publishVideo(req, res) {
    const result = await videosService.publishVideo(req);
    return sendSuccess(res, { data: result || {}, message: "publishVideo success" });
  },
  async rejectVideo(req, res) {
    const result = await videosService.rejectVideo(req);
    return sendSuccess(res, { data: result || {}, message: "rejectVideo success" });
  },
  async getRelatedVideos(req, res) {
    const result = await videosService.getRelatedVideos(req);
    return sendSuccess(res, { data: result || {}, message: "getRelatedVideos success" });
  },
  async updateVideoProgress(req, res) {
    const result = await videosService.updateVideoProgress(req);
    return sendSuccess(res, { data: result || {}, message: "updateVideoProgress success" });
  },
  async getVideoTranscript(req, res) {
    const result = await videosService.getVideoTranscript(req);
    return sendSuccess(res, { data: result || {}, message: "getVideoTranscript success" });
  },
  async generateVideoSummaryFromVideoId(req, res) {
    const result = await videosService.generateVideoSummaryFromVideoId(req);
    return sendSuccess(res, {
      data: result || {},
      message: "generateVideoSummaryFromVideoId success",
    });
  },
});
