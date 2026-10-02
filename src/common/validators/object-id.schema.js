import { z } from "zod";

// Schema tái sử dụng cho `req.params` chứa MongoDB ObjectId (vd. /recipes/:id).
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

export const idParamsSchema = z.strictObject({ id: objectIdSchema });
