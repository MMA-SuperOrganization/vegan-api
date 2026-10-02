import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createPostsValidation = () => ({
  getPosts: {
    query: paginationSchema.passthrough(),
  },
  getMyPosts: {
    query: paginationSchema.passthrough(),
  },
  getPost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  createPost: {
    body: z.object({}).passthrough(),
  },
  updatePost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deletePost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  submitPost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  publishPost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  rejectPost: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
});
