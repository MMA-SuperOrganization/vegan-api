import { z } from "zod";

export const id = z.string().regex(/^[a-f\d]{24}$/i, "Expected a MongoDB ObjectId");
export const uuid = z.uuid();
export const text = (max = 200, min = 1) => z.string().trim().min(min).max(max);
export const positive = (max = 1_000_000) => z.number().finite().positive().max(max);
export const dateTime = z.iso.datetime({ offset: true });
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Invalid calendar date");
export const units = z.enum(["g", "kg", "ml", "l", "piece", "tbsp", "tsp", "cup", "serving"]);
export const dietTypes = z.enum([
  "vegan",
  "vegetarian",
  "lacto_vegetarian",
  "ovo_vegetarian",
  "lacto_ovo_vegetarian",
  "pescatarian",
  "flexitarian",
  "other",
]);
export const pagination = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const rangeQuery = pagination
  .extend({
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .refine(
    ({ from, to }) =>
      !from || !to || (from <= to && new Date(to) - new Date(from) <= 366 * 86400000),
    "Range must be ordered and at most 366 days",
  );
export const patch = (schema) =>
  schema
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, "At least one field is required");
export const targetParams = (types) =>
  z.object({ targetType: z.enum(types), targetId: id }).strict();
export const nutrients = z
  .object(
    Object.fromEntries(
      [
        "caloriesKcal",
        "proteinG",
        "carbsG",
        "fatG",
        "fiberG",
        "sugarG",
        "sodiumMg",
        "calciumMg",
        "ironMg",
        "vitaminB12Mcg",
        "vitaminDMcg",
      ].map((key) => [key, z.number().finite().min(0).max(1_000_000).default(0)]),
    ),
  )
  .strict();
export const emptyBody = z.object({}).strict();
export const url = z.url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password;
}, "Expected HTTPS URL without embedded credentials");
export const timezone = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Invalid IANA timezone");
