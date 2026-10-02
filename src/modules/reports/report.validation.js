import { z } from "zod";

export const createReportBodySchema = z
  .object({
    targetType: z.enum(["recipe", "post", "video", "comment", "user"]),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    reason: z.string().trim().min(1),
    details: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateReportBodySchema = z
  .object({
    status: z.enum(["reviewing", "resolved", "dismissed"]).optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");
