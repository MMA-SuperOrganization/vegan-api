import request from "supertest";
import { describe, expect, it } from "vitest";

import { bearer, buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";

describe("Authentication on /api/v1/users/me", () => {
  it("rejects requests without a token", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: "TOKEN_MISSING", errors: [] });
    expect(res.body.requestId).toBeTruthy();
  });

  it("rejects a non-Bearer Authorization header", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set("Authorization", "Basic abc");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_MISSING");
  });

  it("rejects an invalid token", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set(bearer("not-a-real-token"));

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_INVALID");
  });

  it("rejects an expired token", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set(bearer("expired-token"));

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });

  it("rejects a banned account", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.banned));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_BANNED");
  });
});

describe("GET /api/v1/users/me", () => {
  it("returns the current user without internal fields", async () => {
    const { app } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.user));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Current user retrieved successfully",
      data: {
        firebaseUid: "uid-user",
        email: "user@example.com",
        username: "green_eater",
        role: "USER",
        status: "ACTIVE",
      },
      meta: null,
    });
    expect(res.body.data.id).toMatch(/^[a-f\d]{24}$/);
    expect(res.body.data).not.toHaveProperty("_id");
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data.lastLoginAt).toBeTruthy();
  });

  it("creates a user record on first sign-in", async () => {
    const { app, userRepository } = buildTestApp();

    const res = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.newcomer));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      firebaseUid: "uid-new",
      email: "new.person@example.com",
      role: "USER",
      username: null,
    });
    expect(await userRepository.findByFirebaseUid("uid-new")).not.toBeNull();
  });
});

describe("PATCH /api/v1/users/me", () => {
  it("updates allowed fields with sanitized input", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ username: "  Plant_Lover  " });

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("plant_lover");
  });

  it.each([
    ["role", { role: "ADMIN" }],
    ["status", { status: "ACTIVE" }],
    ["firebaseUid", { firebaseUid: "someone-else" }],
    ["email", { email: "hacker@example.com" }],
  ])("rejects attempts to change %s", async (field, payload) => {
    const { app, userRepository } = buildTestApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ username: "valid_name", ...payload });

    console.log('DEBUG 500:', res.status, res.body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors[0]).toMatchObject({
      location: "body",
      code: "unrecognized_keys",
      keys: [field],
    });

    const stored = await userRepository.findByFirebaseUid("uid-user");
    expect(stored).toMatchObject({ role: "USER", status: "ACTIVE", username: "green_eater" });
  });

  it("rejects an invalid username", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ username: "a!" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors.map((error) => error.path)).toContain("username");
  });

  it("rejects an empty body", async () => {
    const { app } = buildTestApp();

    const res = await request(app).patch("/api/v1/users/me").set(bearer(TEST_TOKENS.user)).send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 when the username is taken by another user", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ username: "admin" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DUPLICATE_KEY");
  });

  it("requires authentication before validation", async () => {
    const { app } = buildTestApp();

    const res = await request(app).patch("/api/v1/users/me").send({ role: "ADMIN" });

    expect(res.status).toBe(401);
  });
});
