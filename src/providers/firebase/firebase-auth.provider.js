import { ERROR_CODES } from "../../common/constants/error-codes.js";
import { AppError } from "../../common/errors/app-error.js";

const TOKEN_ERROR_MAP = {
  "auth/id-token-expired": {
    code: ERROR_CODES.TOKEN_EXPIRED,
    message: "Authentication token has expired",
  },
  "auth/id-token-revoked": {
    code: ERROR_CODES.TOKEN_REVOKED,
    message: "Authentication token has been revoked",
  },
  "auth/user-disabled": {
    code: ERROR_CODES.ACCOUNT_DISABLED,
    message: "This account has been disabled",
    statusCode: 403,
  },
  "auth/argument-error": {
    code: ERROR_CODES.TOKEN_INVALID,
    message: "Invalid authentication token",
  },
  "auth/invalid-id-token": {
    code: ERROR_CODES.TOKEN_INVALID,
    message: "Invalid authentication token",
  },
  "auth/user-not-found": {
    code: ERROR_CODES.TOKEN_INVALID,
    message: "Invalid authentication token",
  },
};

/**
 * Map lỗi Firebase Admin sang AppError. Lỗi hạ tầng (mạng, credential server) trả 503
 * để client không hiểu nhầm là token sai.
 */
export const mapFirebaseAuthError = (error) => {
  const mapped = TOKEN_ERROR_MAP[error?.code];
  if (mapped) {
    return new AppError({
      statusCode: mapped.statusCode ?? 401,
      code: mapped.code,
      message: mapped.message,
      cause: error,
    });
  }
  if (typeof error?.code === "string" && error.code.startsWith("auth/")) {
    return new AppError({
      statusCode: 401,
      code: ERROR_CODES.TOKEN_INVALID,
      message: "Invalid authentication token",
      cause: error,
    });
  }
  return new AppError({
    statusCode: 503,
    code: ERROR_CODES.AUTH_PROVIDER_ERROR,
    message: "Authentication service is temporarily unavailable",
    isOperational: false,
    cause: error,
  });
};

/**
 * Adapter bọc Firebase Admin Auth. Service/middleware chỉ phụ thuộc contract:
 *   verifyIdToken(token) → { firebaseUid, email, emailVerified, authTime }
 *
 * @param {{ firebaseAuth: import("firebase-admin/auth").Auth, checkRevoked?: boolean }} deps
 */
export const createFirebaseAuthProvider = ({ firebaseAuth, checkRevoked = true }) => ({
  async verifyIdToken(idToken) {
    try {
      // checkRevoked=true: Firebase kiểm tra thêm token bị thu hồi và user bị disable.
      const decoded = await firebaseAuth.verifyIdToken(idToken, checkRevoked);
      return {
        firebaseUid: decoded.uid,
        email: decoded.email?.toLowerCase() ?? null,
        emailVerified: decoded.email_verified === true,
        authTime: decoded.auth_time ? new Date(decoded.auth_time * 1000) : null,
      };
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  },
});
