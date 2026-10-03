import slugify from "slugify";
import { AppError } from "./errors/app-error.js";

export const objectIdString = (value) => (value == null ? null : String(value._id ?? value));
export const requireFound = (value, message = "Resource not found") => {
  if (!value) throw AppError.notFound(message);
  return value;
};
export const assertOwner = (resource, actor, { allowAdmin = false, field = "userId" } = {}) => {
  requireFound(resource);
  const userId = typeof actor === "string" ? actor : actor?.userId;
  if (
    objectIdString(resource[field]) !== objectIdString(userId) &&
    !(allowAdmin && actor?.role === "admin")
  ) {
    throw AppError.forbidden();
  }
  return resource;
};
export const publicFilter = (additional = {}) => ({
  ...additional,
  status: "published",
  visibility: "public",
  deletedAt: null,
});
export const slug = (value) =>
  slugify(value, { lower: true, strict: true, trim: true }) || "content";
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SENSITIVE =
  /^(?:password|passwordHash|token|fcmTokens|authorization|privateKey|apiKey|medicalNotes|content|prompt|transcript|rawImage|email)$/i;
export const redact = (value) => {
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value.toHexString) return value.toHexString();
  if (Array.isArray(value)) return value.slice(0, 100).map(redact);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE.test(key) ? "[REDACTED]" : redact(item),
    ]),
  );
};
export const withAudit = async (audit, entry, work) => {
  const result = await work();
  if (entry.actor?.role === "admin") await audit.record({ ...entry, after: result });
  return result;
};
