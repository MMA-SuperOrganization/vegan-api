import { sendSuccess } from "../../common/utils/api-response.js";

export const createPostController = ({ postService }) => ({
  async getPosts(req, res) {
    const result = await postService.getPosts(req.query.filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "Posts retrieved", ...result });
  },

  async getMyPosts(req, res) {
    const filter = { ...req.query.filter, authorId: req.auth.userId };
    const result = await postService.getPosts(filter, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return sendSuccess(res, { message: "My posts retrieved", ...result });
  },

  async getPost(req, res) {
    const post = await postService.getPost(req.validated.params.id);
    return sendSuccess(res, { message: "Post retrieved", data: post });
  },

  async createPost(req, res) {
    const post = await postService.createPost(req.validated.body, req.auth.userId);
    return sendSuccess(res, { message: "Post created", data: post }, 201);
  },

  async updatePost(req, res) {
    const post = await postService.updatePost(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
    );
    return sendSuccess(res, { message: "Post updated", data: post });
  },

  async deletePost(req, res) {
    await postService.deletePost(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Post deleted" });
  },

  async submitPost(req, res) {
    await postService.submitPost(req.validated.params.id, req.auth.userId);
    return sendSuccess(res, { message: "Post submitted" });
  },

  async publishPost(req, res) {
    await postService.publishPost(req.validated.params.id);
    return sendSuccess(res, { message: "Post published" });
  },

  async rejectPost(req, res) {
    await postService.rejectPost(req.validated.params.id, req.body.reason);
    return sendSuccess(res, { message: "Post rejected" });
  },
});
