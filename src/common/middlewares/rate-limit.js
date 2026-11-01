import { rateLimit } from "express-rate-limit";

import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";

/**
 * Rate limiter trả lỗi theo format chung (đi qua global error handler).
 * @param {{ enabled?: boolean, windowMs: number, limit: number, message?: string }} options
 */
export const createRateLimiter = ({
  enabled = true,
  windowMs,
  limit,
  message = "Too many requests, please try again later",
}) => {
  if (!enabled) return (_req, _res, next) => next();

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError({ statusCode: 429, code: ERROR_CODES.TOO_MANY_REQUESTS, message })),
  });
};
