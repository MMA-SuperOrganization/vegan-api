import { createAuthenticate } from "./authenticate.js";

let authProviderInstance = null;
let userRepositoryInstance = null;

export const setAuthDependencies = (authProvider, userRepository) => {
  authProviderInstance = authProvider;
  userRepositoryInstance = userRepository;
};

import { AppError } from "../errors/app-error.js";

const resolveUser = async (identity) => {
  let user = await userRepositoryInstance.findByFirebaseUid(identity.firebaseUid);
  
  if (user && user.status === "BANNED") {
    throw AppError.forbidden("Account is banned", "ACCOUNT_BANNED");
  }

  if (!user) {
    user = await userRepositoryInstance.create({
      firebaseUid: identity.firebaseUid,
      email: identity.email ? identity.email.toLowerCase() : null,
      role: "USER",
      status: "ACTIVE",
      username: null,
      lastLoginAt: new Date(),
    });
  } else {
    user = await userRepositoryInstance.updateById(user._id, { lastLoginAt: new Date() });
  }
  
  return {
    id: user._id,
    role: user.role,
    status: user.status
  };
};

export const authenticate = async (req, res, next) => {
  if (!authProviderInstance) return next();
  const mw = createAuthenticate({ authProvider: authProviderInstance, resolveUser });
  return mw(req, res, next);
};

export const optionalAuthenticate = async (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};
