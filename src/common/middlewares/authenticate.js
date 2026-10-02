import { ERROR_CODES } from "../constants/error-codes.js";
import { AppError } from "../errors/app-error.js";

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;
// Firebase ID token là JWT, thường ~1KB; giới hạn để từ chối sớm header bất thường.
const MAX_TOKEN_LENGTH = 4096;

export const extractBearerToken = (header) => {
  if (typeof header !== "string") return null;
  const match = header.trim().match(BEARER_PATTERN);
  return match ? match[1] : null;
};

/**
 * Tạo middleware xác thực Firebase ID Token.
 *
 * - `authProvider.verifyIdToken(token)` trả về identity đã chuẩn hóa hoặc ném AppError
 *   (token sai / hết hạn / bị thu hồi / tài khoản Firebase bị disable).
 * - `resolveUser(identity)` (inject từ container) đồng bộ user trong DB và ném AppError
 *   nếu tài khoản bị khóa. Nhờ vậy common middleware không phụ thuộc module users.
 *
 * Kết quả gắn vào `req.auth`: { firebaseUid, email, emailVerified, userId, role, status }.
 *
 * @param {{
 *   authProvider: { verifyIdToken: (token: string) => Promise<{ firebaseUid: string, email: string | null, emailVerified: boolean, authTime: Date | null }> },
 *   resolveUser: (identity: object) => Promise<{ id: string, role: string, status: string }>,
 * }} deps
 */
export const createAuthenticate =
  ({ authProvider, resolveUser }) =>
  async (req, _res, next) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(
        AppError.unauthorized(
          "Missing or malformed Authorization header",
          ERROR_CODES.TOKEN_MISSING,
        ),
      );
    }
    if (token.length > MAX_TOKEN_LENGTH) {
      return next(AppError.unauthorized("Invalid authentication token", ERROR_CODES.TOKEN_INVALID));
    }

    try {
      const identity = await authProvider.verifyIdToken(token);
      const user = await resolveUser(identity);

      req.auth = {
        firebaseUid: identity.firebaseUid,
        email: identity.email,
        emailVerified: identity.emailVerified,
        userId: user.id,
        role: user.role,
        status: user.status,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
