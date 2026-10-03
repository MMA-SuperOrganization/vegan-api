import { extractBearerToken } from "./authenticate.js";
import { AppError } from "../errors/app-error.js";

export const createAuthGuards = ({ authProvider, usersService }) => {
  const verify = async (req) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token)
      throw AppError.unauthorized("Missing or malformed Authorization header", "TOKEN_MISSING");
    if (token.length > 4096)
      throw AppError.unauthorized("Invalid authentication token", "TOKEN_INVALID");
    if (!authProvider)
      throw AppError.serviceUnavailable(
        "Firebase authentication is not configured",
        "AUTH_PROVIDER_UNAVAILABLE",
      );
    return authProvider.verifyIdToken(token);
  };
  const firebaseAuthenticate = async (req, _res, next) => {
    try {
      req.auth = await verify(req);
      next();
    } catch (error) {
      next(error);
    }
  };
  const authenticate = async (req, _res, next) => {
    try {
      const identity = await verify(req);
      const actor = await usersService.resolveIdentity(identity);
      if (actor.status !== "active")
        throw AppError.forbidden("Account is not active", "ACCOUNT_INACTIVE");
      req.auth = { ...identity, ...actor, userId: String(actor.userId ?? actor.id) };
      next();
    } catch (error) {
      next(error);
    }
  };
  const optionalAuthenticate = (req, res, next) =>
    req.headers.authorization ? authenticate(req, res, next) : next();
  return { authenticate, optionalAuthenticate, firebaseAuthenticate };
};
