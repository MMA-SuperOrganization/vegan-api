import { z } from "zod";
import { id, text, pagination } from "../../common/validators/domain.schemas.js";
import { idParams } from "../recipes/content.validation.js";
export const createCommentsValidation = () => ({
  getComments: {
    query: pagination
      .extend({
        targetType: z.enum(["recipe", "post", "video"]),
        targetId: id,
        parentCommentId: id.optional(),
        sort: z.enum(["newest", "oldest"]).default("newest"),
      })
      .strict(),
  },
  createComment: {
    body: z
      .object({
        targetType: z.enum(["recipe", "post", "video"]),
        targetId: id,
        parentCommentId: id.optional().nullable(),
        content: text(5000),
      })
      .strict(),
  },
  updateComment: {
    params: idParams,
    body: z.object({ content: text(5000), version: z.number().int().min(0).optional() }).strict(),
  },
  deleteComment: { params: idParams },
});
