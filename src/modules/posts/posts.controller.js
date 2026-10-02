import { sendSuccess } from "../../common/utils/api-response.js";

export const createPostsController = ({ postsService }) => ({
  async getPosts(req, res) {
    const result = await postsService.getPosts(req);
    return sendSuccess(res, { data: result || {}, message: "getPosts success" });
  },
  async getMyPosts(req, res) {
    const result = await postsService.getMyPosts(req);
    return sendSuccess(res, { data: result || {}, message: "getMyPosts success" });
  },
  async getPost(req, res) {
    const result = await postsService.getPost(req);
    return sendSuccess(res, { data: result || {}, message: "getPost success" });
  },
  async createPost(req, res) {
    const result = await postsService.createPost(req);
    return sendSuccess(res, { data: result || {}, message: "createPost success" });
  },
  async updatePost(req, res) {
    const result = await postsService.updatePost(req);
    return sendSuccess(res, { data: result || {}, message: "updatePost success" });
  },
  async deletePost(req, res) {
    const result = await postsService.deletePost(req);
    return sendSuccess(res, { data: result || {}, message: "deletePost success" });
  },
  async submitPost(req, res) {
    const result = await postsService.submitPost(req);
    return sendSuccess(res, { data: result || {}, message: "submitPost success" });
  },
  async publishPost(req, res) {
    const result = await postsService.publishPost(req);
    return sendSuccess(res, { data: result || {}, message: "publishPost success" });
  },
  async rejectPost(req, res) {
    const result = await postsService.rejectPost(req);
    return sendSuccess(res, { data: result || {}, message: "rejectPost success" });
  },
});
