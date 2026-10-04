import { z } from "zod";
import { id, text, pagination } from "./domain.schemas.js";
export const idParams = z.object({ id }).strict();
export const slugParams = z.object({ idOrSlug: text(240).regex(/^[a-zA-Z0-9_-]+$/) }).strict();
export const empty = z.object({}).strict();
export const versionBody = z.object({ version: z.number().int().min(0).optional() }).strict();
export const rejectBody = versionBody.extend({ reason: text(1000) });
export const ids = z
  .array(id)
  .max(50)
  .transform((values) => [...new Set(values)]);
export const tags = z
  .array(text(60))
  .max(30)
  .transform((values) => [...new Set(values)]);
const queryArray = (schema, max = 50) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : value,
    z.array(schema).max(max),
  );
export const contentQuery = pagination
  .extend({
    q: text(100).optional(),
    category: id.optional(),
    categoryId: id.optional(),
    tags: queryArray(text(60), 30).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    sort: z.enum(["newest", "oldest", "popular", "rating", "quickest"]).default("newest"),
  })
  .strict();
export const mineQuery = pagination
  .extend({
    status: z
      .enum(["draft", "pending_review", "processing", "published", "rejected", "hidden", "deleted"])
      .optional(),
  })
  .strict();
export const contentPatch = (schema) =>
  schema
    .partial()
    .extend({ version: z.number().int().min(0).optional() })
    .strict()
    .refine(
      (body) => Object.keys(body).some((key) => key !== "version"),
      "At least one editable field is required",
    );
export const excludedAllergens = queryArray(id);
