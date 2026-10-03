import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";
import { dateOnly } from "../../common/validators/domain.schemas.js";

export const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
export const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const integer = (max, fallback) => z.coerce.number().int().min(1).max(max).default(fallback);
export const pagination = { page: integer(10000, 1), limit: integer(100, 20) };
export const dateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value));
export const targetTypes = ["recipe", "post", "video", "comment", "user"];
export const contentTypes = ["recipe", "post", "video"];
export const empty = z.object({}).strict();
export const idParams = z.object({ id }).strict();
export const targetParams = z
  .object({ targetType: z.enum(["recipe", "post", "video", "comment"]), targetId: id })
  .strict();
export const publicFilter = { status: "published", visibility: "public", deletedAt: null };
export const found = (value, message = "Resource not found") => {
  if (!value) throw AppError.notFound(message);
  return value;
};
export const user = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  if (actor.status && actor.status !== "active") throw AppError.forbidden("Account is not active");
  return actor.userId;
};
export const admin = (actor) => {
  user(actor);
  if (actor.role !== "admin") throw AppError.forbidden();
  return actor.userId;
};
export const repository = (deps, key) => {
  const value = deps.repositories?.[key];
  if (!value)
    throw AppError.serviceUnavailable(`${key} repository is unavailable`, "DEPENDENCY_UNAVAILABLE");
  return value;
};
export const service = (deps, key, method) => {
  const value = deps.services?.[key];
  if (typeof value?.[method] !== "function")
    throw AppError.serviceUnavailable(`${key} service is unavailable`, "DEPENDENCY_UNAVAILABLE");
  return value[method].bind(value);
};
export const now = (deps) => new Date(deps.clock ? deps.clock() : Date.now());
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const listData = (value) => (Array.isArray(value) ? value : (value?.data ?? []));
export const isPublic = (value) =>
  value && value.status === "published" && value.visibility === "public" && !value.deletedAt;
export const summarizeContent = (value) => {
  const result = {};
  for (const key of [
    "_id",
    "id",
    "slug",
    "title",
    "description",
    "excerpt",
    "coverMediaId",
    "thumbnailMediaId",
    "categoryIds",
    "tags",
    "dietTypes",
    "allergenIds",
    "difficulty",
    "totalMinutes",
    "totalTimeMinutes",
    "nutritionPerServing",
    "publishedAt",
    "createdAt",
    "authorId",
    "ratingAverage",
    "ratingCount",
    "viewCount",
    "durationSeconds",
  ]) {
    if (value[key] !== undefined)
      result[key] =
        typeof value[key] === "string"
          ? value[key].slice(0, key === "description" || key === "excerpt" ? 300 : 200)
          : value[key];
  }
  return result;
};
const rangeDate = z.union([dateOnly, z.iso.datetime({ offset: true })]);
export const rangeFields = { from: rangeDate.optional(), to: rangeDate.optional() };
export const rangeSchema = (fields = {}) =>
  z
    .object({ ...rangeFields, ...fields })
    .strict()
    .superRefine((value, context) => {
      if (
        value.from &&
        value.to &&
        (new Date(value.to) < new Date(value.from) ||
          new Date(value.to) - new Date(value.from) > 366 * 86400000)
      )
        context.addIssue({
          code: "custom",
          message: "Range must be ordered and at most 366 days",
          path: ["to"],
        });
    });
export const range = (deps, query = {}) => {
  const to = query.to
    ? new Date(query.to.length === 10 ? `${query.to}T23:59:59.999Z` : query.to)
    : now(deps);
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 86400000);
  if (!Number.isFinite(+from) || !Number.isFinite(+to) || from > to || to - from > 366 * 86400000)
    throw AppError.badRequest("Range must be ordered and at most 366 days");
  return { from, to, filter: { $gte: from, $lte: to } };
};
export const atomic = (deps, work) => {
  if (!deps.transaction)
    throw AppError.serviceUnavailable("Transaction support is required", "TRANSACTIONS_REQUIRED");
  return deps.transaction(work);
};
export const audit = (deps, context, action, targetType, targetId, before, after, session) =>
  service(
    deps,
    "audit",
    "record",
  )({ ...context, action, targetType, targetId: String(targetId), before, after, session });
