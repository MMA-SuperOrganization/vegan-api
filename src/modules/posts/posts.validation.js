import { z } from "zod";
import { text } from "../../common/validators/domain.schemas.js";
import {
  idParams,
  versionBody,
  rejectBody,
  ids,
  tags,
  contentQuery,
  mineQuery,
  contentPatch,
} from "../recipes/content.validation.js";
export const postInput = z
  .object({
    title: text(200),
    content: text(30000),
    mediaIds: ids.optional(),
    tags: tags.optional(),
    categoryIds: ids.optional(),
    postType: z.enum(["community", "blog"]).optional(),
    visibility: z.enum(["public", "private"]).optional(),
  })
  .strict();
export const createPostsValidation = () => ({
  getPosts: { query: contentQuery.extend({ postType: z.enum(["community", "blog"]).optional() }) },
  getMyPosts: { query: mineQuery.extend({ postType: z.enum(["community", "blog"]).optional() }) },
  getPost: { params: idParams },
  createPost: { body: postInput },
  updatePost: { params: idParams, body: contentPatch(postInput) },
  deletePost: { params: idParams },
  submitPost: { params: idParams, body: versionBody },
  publishPost: { params: idParams, body: versionBody },
  rejectPost: { params: idParams, body: rejectBody },
});
