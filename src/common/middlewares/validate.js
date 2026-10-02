import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";

const LOCATIONS = ["params", "query", "body"];

/**
 * Chuẩn hóa Zod issues thành chi tiết lỗi gọn cho client.
 * @param {import("zod").ZodError} zodError
 * @param {string} [location]
 */
export const formatZodIssues = (zodError, location) =>
  zodError.issues.map((issue) => ({
    ...(location && { location }),
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
    ...(issue.keys && { keys: issue.keys }),
  }));

/**
 * Validate `req.params`, `req.query`, `req.body` bằng Zod schema.
 * Dữ liệu đã parse/sanitize được gắn vào `req.validated` cho controller sử dụng.
 * @param {{ body?: import("zod").ZodType, params?: import("zod").ZodType, query?: import("zod").ZodType }} schemas
 */
export const validate =
  (schemas = {}) =>
  (req, _res, next) => {
    const validated = {};
    const details = [];

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      // Không có body (vd. thiếu Content-Type) thì Express 5 để `req.body` là undefined.
      const input = location === "body" ? (req.body ?? {}) : req[location];
      const result = schema.safeParse(input);

      if (result.success) {
        validated[location] = result.data;
      } else {
        details.push(...formatZodIssues(result.error, location));
      }
    }

    if (details.length > 0) {
      return next(AppError.badRequest("Validation failed", details, ERROR_CODES.VALIDATION_ERROR));
    }

    req.validated = validated;
    return next();
  };
