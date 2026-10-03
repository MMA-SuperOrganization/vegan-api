import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp, bearer, TEST_TOKENS } from "../helpers/test-app.js";

// Full method/path/auth/docs/matrix comparison lives in tests/contract and uses
// the independent source tables. This integration suite instead exercises the
// actual prefix, optional-auth behavior and role ordering over HTTP.
describe("Mounted contract runtime boundaries", () => {
  it("mounts business routes only at the configured API prefix", async () => {
    const { app } = buildTestApp({ envOverrides: { API_PREFIX: "/custom/v1" } });
    expect((await request(app).get("/custom/v1/health")).status).toBe(200);
    expect((await request(app).get("/api/v1/health")).status).toBe(404);
    expect((await request(app).get("/health")).status).toBe(404);
  });

  it("optional authentication allows guest search but rejects an invalid supplied token", async () => {
    const { app } = buildTestApp();
    expect((await request(app).get("/api/v1/search?q=tofu")).status).toBe(200);
    const invalid = await request(app).get("/api/v1/search?q=tofu").set(bearer("invalid-token"));
    expect(invalid.status).toBe(401);
    expect(invalid.body).toMatchObject({
      success: false,
      error: { code: expect.any(String) },
      meta: { requestId: expect.any(String) },
    });
  });

  it("admin authentication and authorization precede request validation", async () => {
    const { app } = buildTestApp();
    const path = "/api/v1/admin/users?limit=invalid";
    expect((await request(app).get(path)).status).toBe(401);
    expect((await request(app).get(path).set(bearer(TEST_TOKENS.user))).status).toBe(403);
    expect((await request(app).get(path).set(bearer(TEST_TOKENS.admin))).status).toBe(400);
  });
});
