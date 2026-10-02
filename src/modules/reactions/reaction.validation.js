import { z } from "zod";

export const addReactionBodySchema = z
  .object({
    type: z.enum(["like"]).default("like"),
  })
  .strict();
