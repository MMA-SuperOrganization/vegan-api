import { AppError } from "../errors/app-error.js";

/**
 * Kiểm tra role sau `authenticate`. Dùng cho route quản trị:
 *   router.get("/admin/users", authenticate, authorize(ROLES.ADMIN), ...)
 * @param {...string} allowedRoles
 */
export const authorize = (...allowedRoles) => {
  if (allowedRoles.length === 0) {
    throw new Error("authorize() requires at least one role");
  }

  return (req, _res, next) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!allowedRoles.includes(req.auth.role)) return next(AppError.forbidden());
    return next();
  };
};
