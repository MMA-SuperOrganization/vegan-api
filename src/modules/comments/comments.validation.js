import { z } from "zod";
import { id, text, pagination } from "../../common/validators/domain.schemas.js";
import { idParams } from "../../common/validators/content.schemas.js";
import { COMMENT_TARGET_TYPES } from "../../common/constants/enums/engagement.enums.js";
import { CONTENT_SORTS } from "../../common/constants/enums/content.enums.js";

export const createCommentsValidation = () => ({
  getComments: {
    query: pagination
      .extend({
        targetType: z.enum(COMMENT_TARGET_TYPES.values()),
        targetId: id,
        parentCommentId: id.optional(),
        sort: z.enum([CONTENT_SORTS.NEWEST, CONTENT_SORTS.OLDEST]).default(CONTENT_SORTS.NEWEST),
      })
      .strict(),
  },
  createComment: {
    body: z
      .object({
        targetType: z.enum(COMMENT_TARGET_TYPES.values()),
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
