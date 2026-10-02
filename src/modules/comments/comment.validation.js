import { z } from "zod";

export const createCommentBodySchema = z
  .object({
    targetType: z.enum(["recipe", "post", "video"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    content: z.string().trim().min(1).max(2000),
    parentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
      .optional(),
  })
  .strict();

export const updateCommentBodySchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
  })
  .strict();
