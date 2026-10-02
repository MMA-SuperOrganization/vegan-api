import { AppError } from "../../common/errors/app-error.js";

export const createPostService = ({ postRepository }) => {
  return {
    async getPosts(filter, options) {
      return postRepository.findMany(filter, options);
    },

    async getPost(id) {
      const post = await postRepository.findById(id);
      if (!post) throw AppError.notFound("Post not found");
      return post;
    },

    async createPost(data, userId) {
      return postRepository.create({ ...data, authorId: userId });
    },

    async updatePost(id, data, userId) {
      const existing = await postRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      return postRepository.updateById(id, data);
    },

    async deletePost(id, userId) {
      const existing = await postRepository.findById(id);
      if (!existing) throw AppError.notFound();
      if (String(existing.authorId) !== String(userId)) throw AppError.forbidden();

      await postRepository.updateById(id, { status: "hidden" });
    },

    async submitPost(id, userId) {
      return postRepository.updateById(id, { status: "pending" });
    },

    async publishPost(id) {
      return postRepository.updateById(id, { status: "published", publishedAt: new Date() });
    },

    async rejectPost(id, reason) {
      return postRepository.updateById(id, { status: "rejected", moderationNote: reason });
    },
  };
};
