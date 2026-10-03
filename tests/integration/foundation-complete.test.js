import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../../src/common/middlewares/rate-limit.js";
import { loadEnv } from "../../src/config/env.js";
import { buildTestApp, bearer, TEST_TOKENS } from "../helpers/test-app.js";
import { startServer } from "../../src/server.js";

const pass = (_req, _res, next) => next();
describe("Foundation security and lifecycle", () => {
  it("global rate limiter enforces limits with standard envelope", async () => {
    const { app } = buildTestApp({
      overrides: { apiRateLimiter: createRateLimiter({ windowMs: 60000, limit: 1 }) },
    });
    expect((await request(app).get("/api/v1/health")).status).toBe(200);
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(res.body.meta.requestId).toBeTruthy();
    expect(res.headers.ratelimit).toBeTruthy();
  });
  it("separate auth limiter counts sync requests rather than bypassing", async () => {
    const { app } = buildTestApp({
      overrides: { authRateLimiter: createRateLimiter({ windowMs: 60000, limit: 1 }) },
    });
    expect(
      (await request(app).post("/api/v1/auth/sync").set(bearer(TEST_TOKENS.newcomer)).send({}))
        .status,
    ).toBe(200);
    expect(
      (await request(app).post("/api/v1/auth/sync").set(bearer(TEST_TOKENS.newcomer)).send({}))
        .status,
    ).toBe(429);
  });
  it("AI and upload requests use their own real limiters", async () => {
    const { app } = buildTestApp({
      overrides: {
        uploadRateLimiter: createRateLimiter({ windowMs: 60000, limit: 1 }),
        aiRateLimiter: createRateLimiter({ windowMs: 60000, limit: 1 }),
      },
    });
    const upload = () =>
      request(app).post("/api/v1/media/upload-requests").set(bearer(TEST_TOKENS.user)).send({});
    expect((await upload()).status).toBe(400);
    expect((await upload()).status).toBe(429);
    const chat = () =>
      request(app).post("/api/v1/ai/meal-plan-proposals").set(bearer(TEST_TOKENS.user)).send({});
    expect((await chat()).status).toBe(400);
    expect((await chat()).status).toBe(429);
  });
  it("rejects oversized JSON with no raw body reflection", async () => {
    const { app } = buildTestApp({ envOverrides: { JSON_BODY_LIMIT: "1kb" } });
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ bio: "secret".repeat(300) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });
  it("provider overrides are respected before SDK credentials initialize", async () => {
    const { app } = buildTestApp({
      envOverrides: {
        FIREBASE_PROJECT_ID: "fake",
        FIREBASE_CLIENT_EMAIL: "fake@example.com",
        FIREBASE_PRIVATE_KEY: "not-a-real-key",
        CLOUDFLARE_R2_ACCOUNT_ID: "fake",
        CLOUDFLARE_R2_ACCESS_KEY_ID: "fake",
        CLOUDFLARE_R2_SECRET_ACCESS_KEY: "fake",
        CLOUDFLARE_R2_BUCKET_NAME: "fake",
      },
      overrides: { authProvider: null, storageProvider: null },
    });
    const res = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.user));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("AUTH_PROVIDER_UNAVAILABLE");
  });
  it("native server shutdown is idempotent", async () => {
    const fixture = buildTestApp();
    const runtime = await startServer({
      env: { ...fixture.env, port: 0 },
      logger: fixture.logger,
      overrides: { ...fixture.container, apiRateLimiter: pass, skipDatabaseConnect: true },
    });
    const url = `http://127.0.0.1:${runtime.server.address().port}/api/v1/health`;
    expect((await fetch(url)).status).toBe(200);
    const first = runtime.stop("test");
    expect(runtime.stop("repeat")).toBe(first);
    await first;
    expect(runtime.server.listening).toBe(false);
  });
  it("bounds shutdown even when a reminder poll stalls", async () => {
    const fixture = buildTestApp();
    const runtime = await startServer({
      env: { ...fixture.env, port: 0, shutdownTimeoutMs: 100 },
      logger: fixture.logger,
      overrides: { ...fixture.container, skipDatabaseConnect: true },
    });
    let release;
    runtime.container.services.reminders.poll = () =>
      new Promise((resolve) => {
        release = resolve;
      });
    const poll = runtime.scheduler.poll();
    await new Promise((resolve) => setImmediate(resolve));
    try {
      await expect(runtime.stop("hung-poll")).rejects.toMatchObject({ code: "SHUTDOWN_TIMEOUT" });
    } finally {
      release({ processed: 0 });
      await poll;
    }
    expect(runtime.server.listening).toBe(false);
  });
  it("rejects invalid configuration without reflecting secrets", () => {
    for (const fields of [
      { AI_ENABLED: "true" },
      { FCM_ENABLED: "true" },
      { RATE_LIMIT_MAX: "0" },
      { REMINDER_LOCK_TTL_MS: "1000" },
      { CORS_ORIGINS: "*" },
      { MONGODB_MIN_POOL_SIZE: "100", MONGODB_MAX_POOL_SIZE: "10" },
      { AI_BASE_URL: "https://user:private-secret@example.com" },
    ]) {
      expect(() => loadEnv({ NODE_ENV: "test", ...fields })).toThrow(/Invalid environment/);
      try {
        loadEnv({ NODE_ENV: "test", ...fields });
      } catch (error) {
        expect(error.message).not.toContain("private-secret");
      }
    }
  });
});
