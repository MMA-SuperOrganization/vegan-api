import { z } from "zod";

export const addRatingBodySchema = z
  .object({
    score: z.number().min(1).max(5),
    review: z.string().trim().max(1000).optional(),
  })
  .strict();
