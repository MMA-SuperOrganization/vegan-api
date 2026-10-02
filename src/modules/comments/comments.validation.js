import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createCommentsValidation = () => ({
  getComments: {
    query: paginationSchema.passthrough(),
  },
  createComment: {
    body: z.object({}).passthrough(),
  },
  updateComment: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteComment: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
