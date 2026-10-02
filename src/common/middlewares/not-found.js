import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";

export const notFound = (req, _res, next) =>
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`, ERROR_CODES.ROUTE_NOT_FOUND));
