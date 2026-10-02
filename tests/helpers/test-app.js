import pino from "pino";

import { createApp } from "../../src/app.js";
import { loadEnv } from "../../src/config/env.js";
import { createContainer } from "../../src/container.js";
import {
  createFakeAuthProvider,
  createFakeStorageProvider,
  createInMemoryUserRepository,
} from "./fakes.js";

const passThrough = (_req, _res, next) => next();

export const TEST_TOKENS = Object.freeze({
  user: "user-token",
  admin: "admin-token",
  banned: "banned-token",
  newcomer: "newcomer-token",
});

/**
 * Tạo app hoàn chỉnh cho Supertest với Firebase, R2 và MongoDB được thay bằng fake.
 * Mọi override đều đi qua container giống như production wiring.
 */
export const buildTestApp = ({ envOverrides = {}, overrides = {} } = {}) => {
  const env = loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    CORS_ORIGINS: "http://localhost:8081",
    ...envOverrides,
  });
  const logger = pino({ level: "silent" });

  const userRepository = createInMemoryUserRepository([
    { firebaseUid: "uid-user", email: "user@example.com", username: "green_eater" },
    { firebaseUid: "uid-admin", email: "admin@example.com", username: "admin", role: "ADMIN" },
    { firebaseUid: "uid-banned", email: "banned@example.com", status: "BANNED" },
  ]);

  const authProvider = createFakeAuthProvider({
    [TEST_TOKENS.user]: { firebaseUid: "uid-user", email: "user@example.com" },
    [TEST_TOKENS.admin]: { firebaseUid: "uid-admin", email: "admin@example.com" },
    [TEST_TOKENS.banned]: { firebaseUid: "uid-banned", email: "banned@example.com" },
    [TEST_TOKENS.newcomer]: { firebaseUid: "uid-new", email: "New.Person@Example.com" },
  });

  const storageProvider = createFakeStorageProvider();

  const container = createContainer({
    env,
    logger,
    overrides: {
      authProvider,
      storageProvider,
      userRepository,
      getDatabaseStatus: () => "connected",
      apiRateLimiter: passThrough,
      uploadRateLimiter: passThrough,
      ...overrides,
    },
  });

  return { app: createApp(container), container, userRepository, storageProvider };
};

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
