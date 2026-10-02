import { AppError } from "../../common/errors/app-error.js";

export const createVideoService = ({ videoRepository }) => {
  return {
    async getVideos(filter, options) {
      return videoRepository.findMany(filter, options);
    },

    async getVideo(idOrSlug) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
      const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
      const res = await videoRepository.findMany(filter, { limit: 1 });
      const video = res.data[0];
      if (!video) throw AppError.notFound("Video not found");
      return video;
    },

    async createVideo(data, userId) {
      return videoRepository.create({ ...data, authorId: userId });
    },

    async updateVideo(id, data, userId) {
      const existing = await videoRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      return videoRepository.updateById(id, data);
    },

    async deleteVideo(id, userId) {
      const existing = await videoRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      await videoRepository.updateById(id, { status: "hidden" });
    },

    async submitVideo(id, userId) {
      return videoRepository.updateById(id, { status: "pending" });
    },

    async publishVideo(id) {
      return videoRepository.updateById(id, { status: "published", publishedAt: new Date() });
    },

    async rejectVideo(id, reason) {
      return videoRepository.updateById(id, { status: "rejected", moderationNote: reason });
    },
  };
};
