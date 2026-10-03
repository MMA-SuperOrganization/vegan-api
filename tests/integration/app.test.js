import request from "supertest";
import { describe, expect, it } from "vitest";
import { bearer, buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";

describe("Application boundaries", () => {
  it("liveness is independent of readiness and echoes a safe request ID", async () => {
    const { app } = buildTestApp({ overrides: { getDatabaseStatus: () => "disconnected" } });
    const live = await request(app).get("/api/v1/health").set("X-Request-Id", "req-live");
    expect(live.status).toBe(200);
    expect(live.body).toMatchObject({
      success: true,
      data: { app: "vegan-support-api", uptimeSeconds: expect.any(Number) },
      meta: { requestId: "req-live" },
    });
    const ready = await request(app).get("/api/v1/health/ready");
    expect(ready.status).toBe(503);
    expect(ready.body.error.code).toBe("DATABASE_UNAVAILABLE");
  });
  it("readiness reports connected dependencies without exposing credentials", async () => {
    const { app } = buildTestApp({
      envOverrides: { MONGODB_URI: "mongodb+srv://secret-user:secret-pass@cluster.example.net/db" },
    });
    const res = await request(app).get("/api/v1/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "ready", database: "connected" });
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });
  it("returns the standard not-found envelope", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/v1/does-not-exist").set("X-Request-Id", "req-123");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: "Route GET /api/v1/does-not-exist not found",
        code: "ROUTE_NOT_FOUND",
        details: [],
      },
      meta: { requestId: "req-123" },
    });
  });
  it("rejects malformed JSON before dispatch", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .set("Content-Type", "application/json")
      .send('{"displayName": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
  it("replaces an unsafe or oversized request ID", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/v1/health").set("X-Request-Id", "a".repeat(100));
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.meta.requestId).toBe(res.headers["x-request-id"]);
  });
  it("serves YAML, JSON and Swagger when explicitly enabled", async () => {
    const { app } = buildTestApp({ envOverrides: { SWAGGER_ENABLED: "true" } });
    const json = await request(app).get("/api-docs.json");
    expect(json.status).toBe(200);
    expect(json.body.openapi).toMatch(/^3\./);
    expect(Object.keys(json.body.paths)).toEqual(
      expect.arrayContaining(["/health", "/users/me", "/media/upload-requests"]),
    );
    expect((await request(app).get("/api-docs/openapi.yaml")).status).toBe(200);
    expect((await request(app).get("/api-docs/")).status).toBe(200);
  });
  it("disables docs by configuration", async () => {
    const { app } = buildTestApp();
    expect((await request(app).get("/api-docs.json")).status).toBe(404);
  });
  it("allows configured CORS origins and denies others", async () => {
    const { app } = buildTestApp();
    const allowed = await request(app).get("/api/v1/health").set("Origin", "http://localhost:8081");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
    const rejected = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://evil.example.com");
    expect(rejected.status).toBe(403);
    expect(rejected.body.success).toBe(false);
  });
});
