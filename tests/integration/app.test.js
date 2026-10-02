import request from "supertest";
import { describe, expect, it } from "vitest";

import { bearer, buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";

describe("GET /api/v1/health", () => {
  it("returns healthy status in the standard success format", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Service is healthy",
      data: { status: "ok", environment: "test", services: { database: "connected" } },
      meta: null,
    });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("returns 503 when the database is not connected and never exposes secrets", async () => {
    const { app } = buildTestApp({
      envOverrides: { MONGODB_URI: "mongodb+srv://secret-user:secret-pass@cluster.example.net/db" },
      overrides: { getDatabaseStatus: () => "disconnected" },
    });

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe("degraded");
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });
});

describe("Unknown routes", () => {
  it("returns 404 in the standard error format", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/does-not-exist").set("X-Request-Id", "req-123");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Route GET /api/v1/does-not-exist not found",
      code: "ROUTE_NOT_FOUND",
      errors: [],
      requestId: "req-123",
    });
  });

  it("returns 400 INVALID_JSON for malformed JSON bodies", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .set("Content-Type", "application/json")
      .send('{"username": ');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_JSON");
  });
});

describe("Swagger UI", () => {
  it("serves the OpenAPI document", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(["/health", "/users/me", "/media/upload-requests"]),
    );
  });

  it("can be disabled by configuration", async () => {
    const { app } = buildTestApp({ envOverrides: { SWAGGER_ENABLED: "false" } });

    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(404);
  });
});

describe("CORS", () => {
  it("allows whitelisted origins and rejects others", async () => {
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
