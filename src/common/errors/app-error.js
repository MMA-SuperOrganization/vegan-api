import { ERROR_CODES } from "../constants/error-codes.js";

/**
 * Lỗi nghiệp vụ/HTTP có kiểm soát. `isOperational = true` nghĩa là lỗi dự kiến,
 * message an toàn để trả về client.
 */
export class AppError extends Error {
  /**
   * @param {{
   *   statusCode?: number,
   *   code?: string,
   *   message: string,
   *   details?: unknown[],
   *   isOperational?: boolean,
   *   cause?: unknown,
   * }} options
   */
  constructor({
    statusCode = 500,
    code = ERROR_CODES.INTERNAL_ERROR,
    message,
    details = [],
    isOperational = true,
    cause,
  }) {
    super(message, { cause });
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
  }

  static badRequest(message, details = [], code = ERROR_CODES.BAD_REQUEST) {
    return new AppError({ statusCode: 400, code, message, details });
  }

  static unauthorized(message = "Authentication required", code = ERROR_CODES.UNAUTHORIZED) {
    return new AppError({ statusCode: 401, code, message });
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    code = ERROR_CODES.FORBIDDEN,
  ) {
    return new AppError({ statusCode: 403, code, message });
  }

  static notFound(message = "Resource not found", code = ERROR_CODES.NOT_FOUND) {
    return new AppError({ statusCode: 404, code, message });
  }

  static conflict(message, details = [], code = ERROR_CODES.CONFLICT) {
    return new AppError({ statusCode: 409, code, message, details });
  }

  static serviceUnavailable(message, code = ERROR_CODES.SERVICE_UNAVAILABLE) {
    return new AppError({ statusCode: 503, code, message });
  }
}
