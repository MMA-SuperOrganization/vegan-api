import { AppError } from "../../common/errors/app-error.js";

export const createVideosService = ({ videosRepository }) => ({
  async getVideos(req) {
    return await videosRepository.findAll(req.query);
  },
  async getMyVideos(req) {
    return await videosRepository.findAll(req.query);
  },
  async getVideo(req) {
    return await videosRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createVideo(req) {
    return await videosRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateVideo(req) {
    return await videosRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteVideo(req) {
    return await videosRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async submitVideo(req) {
    return await videosRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async publishVideo(req) {
    return await videosRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async rejectVideo(req) {
    return await videosRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getRelatedVideos(req) {
    return await videosRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async updateVideoProgress(req) {
    return await videosRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async getVideoTranscript(req) {
    return await videosRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async generateVideoSummaryFromVideoId(req) {
    return await videosRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
