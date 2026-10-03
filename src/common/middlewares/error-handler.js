import mongoose from "mongoose";
import { ZodError } from "zod";

import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";
import { buildErrorBody } from "../utils/api-response.js";
import { formatZodIssues } from "./validate.js";

const isDuplicateKeyError = (error) => error?.code === 11000 || error?.code === 11001;

/**
 * Chuyển mọi loại lỗi về AppError để trả response thống nhất.
 * Không đưa giá trị dữ liệu (vd. email trùng) hay chi tiết nội bộ ra client.
 * @param {unknown} error
 * @returns {AppError}
 */
export const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return AppError.badRequest(
      "Validation failed",
      formatZodIssues(error),
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      path: fieldError.path,
      code: fieldError.kind,
      message: `Invalid value for ${fieldError.path}`,
    }));
    return AppError.badRequest("Validation failed", details, ERROR_CODES.VALIDATION_ERROR);
  }

  if (error instanceof mongoose.Error.CastError) {
    return AppError.badRequest(
      `Invalid value for field "${error.path}"`,
      [{ path: error.path, code: "invalid_type" }],
      ERROR_CODES.INVALID_ID,
    );
  }

  if (isDuplicateKeyError(error)) {
    const fields = Object.keys(error.keyPattern ?? error.keyValue ?? {});
    const details = fields.map((field) => ({
      path: field,
      code: "duplicate",
      message: `${field} already exists`,
    }));
    return AppError.conflict("Resource already exists", details, ERROR_CODES.DUPLICATE_KEY);
  }

  // Lỗi do express.json() (body-parser nội bộ của Express) sinh ra.
  if (error?.type === "entity.parse.failed") {
    return AppError.badRequest("Malformed JSON body", [], ERROR_CODES.INVALID_JSON);
  }
  if (error?.type === "entity.too.large") {
    return new AppError({
      statusCode: 413,
      code: ERROR_CODES.PAYLOAD_TOO_LARGE,
      message: "Request payload too large",
    });
  }

  // Lưới an toàn khi lỗi Firebase/AWS lọt ra ngoài provider mà chưa được map.
  if (typeof error?.code === "string" && error.code.startsWith("auth/")) {
    return AppError.unauthorized("Invalid authentication token", ERROR_CODES.TOKEN_INVALID);
  }
  if (error?.$metadata) {
    return new AppError({
      statusCode: 503,
      code: ERROR_CODES.STORAGE_PROVIDER_ERROR,
      message: "Storage provider request failed",
      isOperational: false,
    });
  }

  return new AppError({
    statusCode: 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "Internal server error",
    isOperational: false,
    cause: error,
  });
};

/**
 * Global error middleware, phải đăng ký cuối cùng.
 * @param {{ logger: import("pino").Logger, isProduction: boolean }} deps
 */
export const createErrorHandler =
  ({ logger, isProduction }) =>
  // Express nhận diện error middleware qua đúng 4 tham số, kể cả khi không dùng `_next`.
  (error, req, res, _next) => {
    const appError = normalizeError(error);
    const requestId = req.id ?? null;

    if (appError.statusCode >= 500) {
      (req.log ?? logger).error(
        { requestId, code: appError.code, statusCode: appError.statusCode },
        "Unhandled request error",
      );
    }

    if (res.headersSent) {
      res.destroy();
      return;
    }

    const body = buildErrorBody({
      message: appError.message,
      code: appError.code,
      errors: appError.details,
      requestId,
    });

    res.status(appError.statusCode).json(body);
  };
