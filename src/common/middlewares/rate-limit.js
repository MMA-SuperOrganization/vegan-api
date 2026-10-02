import { rateLimit } from "express-rate-limit";

import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";

/**
 * Rate limiter trả lỗi theo format chung (đi qua global error handler).
 * @param {{ windowMs: number, limit: number, message?: string }} options
 */
export const createRateLimiter = ({
  windowMs,
  limit,
  message = "Too many requests, please try again later",
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError({ statusCode: 429, code: ERROR_CODES.TOO_MANY_REQUESTS, message })),
  });
