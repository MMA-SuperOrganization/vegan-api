import { z } from "zod";

export const createModerationCaseBodySchema = z
  .object({
    targetType: z.enum(["recipe", "post", "video", "comment", "user"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    reason: z.string().trim().min(1),
    actionTaken: z.enum(["none", "hidden", "deleted", "user_suspended", "user_banned"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateModerationCaseBodySchema = createModerationCaseBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
