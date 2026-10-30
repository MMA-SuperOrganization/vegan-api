import { z } from "zod";
import { id, text } from "../../common/validators/domain.schemas.js";
import { POST_TYPES, POST_VISIBILITIES } from "../../common/constants/enums/content.enums.js";
import {
  idParams,
  versionBody,
  rejectBody,
  ids,
  tags,
  contentQuery,
  mineQuery,
  contentPatch,
} from "../../common/validators/content.schemas.js";
export const postInput = z
  .object({
    title: text(200),
    content: text(30000),
    mediaIds: ids.optional(),
    tags: tags.optional(),
    categoryIds: ids.optional(),
    recipeId: id.optional().nullable(),
    postType: z.enum(POST_TYPES.values()).optional(),
    visibility: z.enum(POST_VISIBILITIES.values()).optional(),
  })
  .strict();
export const createPostsValidation = () => ({
  getPosts: {
    query: contentQuery.extend({
      postType: z.enum(POST_TYPES.values()).optional(),
      recipeId: id.optional(),
    }),
  },
  getMyPosts: { query: mineQuery.extend({ postType: z.enum(POST_TYPES.values()).optional() }) },
  getPost: { params: idParams },
  createPost: { body: postInput },
  updatePost: { params: idParams, body: contentPatch(postInput) },
  deletePost: { params: idParams },
  submitPost: { params: idParams, body: versionBody },
  publishPost: { params: idParams, body: versionBody },
  rejectPost: { params: idParams, body: rejectBody },
});
