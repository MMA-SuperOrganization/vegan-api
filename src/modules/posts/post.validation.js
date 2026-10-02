import { z } from "zod";

export const createPostBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1),
    content: z.string().trim().min(1),
    thumbnailUrl: z.string().trim().url().max(1024).optional(),
    categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).optional(),
    tags: z.array(z.string().trim()).optional(),
    status: z.enum(["draft", "pending", "published"]).optional(),
  })
  .strict();

export const updatePostBodySchema = createPostBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
