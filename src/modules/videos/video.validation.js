import { z } from "zod";

export const createVideoBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1),
    description: z.string().trim().max(1000).optional(),
    videoUrl: z.string().trim().url().max(1024),
    thumbnailUrl: z.string().trim().url().max(1024).optional(),
    durationSeconds: z.number().min(0).optional(),
    categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).optional(),
    status: z.enum(["draft", "pending", "published"]).optional(),
  })
  .strict();

export const updateVideoBodySchema = createVideoBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
