import pino from "pino";
import { createApp } from "../../src/app.js";
import { loadEnv } from "../../src/config/env.js";
import { createContainer } from "../../src/container.js";
import { createFakeAuthProvider, createFakeStorageProvider } from "./fakes.js";
import { createMemoryRepositories, memoryTransaction } from "./memory-repositories.js";

const passThrough = (_req, _res, next) => next();
export const TEST_TOKENS = Object.freeze({
  user: "user-token",
  other: "other-token",
  admin: "admin-token",
  banned: "banned-token",
  suspended: "banned-token",
  deleted: "deleted-token",
  newcomer: "newcomer-token",
});
export const TEST_IDS = Object.freeze({
  user: "100000000000000000000001",
  other: "100000000000000000000002",
  admin: "100000000000000000000003",
  suspended: "100000000000000000000004",
  deleted: "100000000000000000000005",
});

// All persistence/provider dependencies are replaced before production SDK construction.
export const buildTestApp = ({
  envOverrides = {},
  overrides = {},
  seed = {},
  clock = () => new Date("2026-10-03T12:00:00Z"),
} = {}) => {
  const env = loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    SWAGGER_ENABLED: "false",
    CORS_ORIGINS: "http://localhost:8081",
    ...envOverrides,
  });
  const logger = pino({ level: "silent" });
  const users = Object.entries(TEST_IDS).map(([kind, _id]) => ({
    _id,
    firebaseUid: `uid-${kind}`,
    email: `${kind}@example.com`,
    displayName: kind,
    role: kind === "admin" ? "admin" : "user",
    status: ["suspended", "deleted"].includes(kind) ? kind : "active",
    onboardingCompleted: false,
    fcmTokens: [],
    deletedAt: kind === "deleted" ? clock() : null,
  }));
  const repositories = {
    ...createMemoryRepositories({ users, ...seed }),
    ...overrides.repositories,
  };
  const authProvider = createFakeAuthProvider(
    Object.fromEntries(
      Object.entries(TEST_TOKENS).map(([kind, token]) => [
        token,
        {
          firebaseUid: `uid-${kind === "banned" ? "suspended" : kind === "newcomer" ? "new" : kind}`,
          email: `${kind}@example.com`,
          displayName: kind,
        },
      ]),
    ),
  );
  const storageProvider = createFakeStorageProvider();
  const aiProvider = {
    enabled: false,
    provider: "fake",
    model: "fake",
    async generate() {
      throw new Error("Configure explicit AI response in test");
    },
  };
  const messagingProvider = {
    enabled: false,
    calls: [],
    async send(input) {
      this.calls.push(input);
      return { successCount: input.tokens.length, failureCount: 0, invalidTokens: [], results: [] };
    },
  };
  const container = createContainer({
    env,
    logger,
    overrides: {
      authProvider,
      storageProvider,
      aiProvider,
      messagingProvider,
      clock,
      transaction: memoryTransaction(repositories),
      getDatabaseStatus: () => "connected",
      apiRateLimiter: passThrough,
      authRateLimiter: passThrough,
      uploadRateLimiter: passThrough,
      aiRateLimiter: passThrough,
      ...overrides,
      repositories,
    },
  });
  return {
    app: createApp(container),
    container,
    repositories,
    userRepository: repositories.users,
    storageProvider,
    authProvider,
    aiProvider,
    messagingProvider,
    env,
    logger,
  };
};
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
