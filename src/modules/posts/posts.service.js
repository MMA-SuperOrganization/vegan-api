import { AppError } from "../../common/errors/app-error.js";

export const createPostsService = ({ postsRepository }) => ({
  async getPosts(req) {
    return await postsRepository.findAll(req.query);
  },
  async getMyPosts(req) {
    return await postsRepository.findAll(req.query);
  },
  async getPost(req) {
    return await postsRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async createPost(req) {
    return await postsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updatePost(req) {
    return await postsRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deletePost(req) {
    return await postsRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async submitPost(req) {
    return await postsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async publishPost(req) {
    return await postsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async rejectPost(req) {
    return await postsRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
});
