import request from "supertest";
import { describe, expect, it } from "vitest";
import { bearer, buildTestApp, TEST_TOKENS, TEST_IDS } from "../helpers/test-app.js";

describe("Authentication on /api/v1/users/me", () => {
  it.each([
    ["missing token", undefined, "TOKEN_MISSING"],
    ["non-Bearer header", "Basic abc", "TOKEN_MISSING"],
    ["invalid token", "Bearer not-a-real-token", "TOKEN_INVALID"],
    ["expired token", "Bearer expired-token", "TOKEN_EXPIRED"],
  ])("rejects %s", async (_label, header, code) => {
    const { app } = buildTestApp();
    let call = request(app).get("/api/v1/users/me");
    if (header) call = call.set("Authorization", header);
    const res = await call;
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code } });
    expect(res.body.meta.requestId).toBeTruthy();
  });
  it.each([
    ["suspended", TEST_TOKENS.suspended, "ACCOUNT_SUSPENDED"],
    ["deleted", TEST_TOKENS.deleted, "ACCOUNT_DELETED"],
  ])("rejects %s account", async (_kind, token, code) => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/v1/users/me").set(bearer(token));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(code);
  });
});
describe("GET /api/v1/users/me", () => {
  it("returns current account and profile without credentials or internal fields", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.user));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        user: { userId: TEST_IDS.user, email: "user@example.com", role: "user", status: "active" },
        profile: null,
        nutritionProfile: null,
      },
    });
    expect(res.body.meta.requestId).toBeTruthy();
    for (const key of ["firebaseUid", "password", "fcmTokens", "fcmTokensVersion"])
      expect(res.body.data.user).not.toHaveProperty(key);
  });
  it("creates a mapping only through explicit idempotent auth sync", async () => {
    const { app, repositories } = buildTestApp();
    const before = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.newcomer));
    expect(before.status).toBe(404);
    expect(await repositories.users.findOne({ firebaseUid: "uid-new" })).toBeNull();
    const synced = await request(app)
      .post("/api/v1/auth/sync")
      .set(bearer(TEST_TOKENS.newcomer))
      .send({});
    expect(synced.status).toBe(200);
    expect(synced.body.data.role).toBe("user");
    const again = await request(app)
      .post("/api/v1/auth/sync")
      .set(bearer(TEST_TOKENS.newcomer))
      .send({});
    expect(again.body.data.userId).toBe(synced.body.data.userId);
    expect(
      (await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.newcomer))).status,
    ).toBe(200);
    expect(await repositories.users.count({ firebaseUid: "uid-new" })).toBe(1);
  });
});
describe("PATCH /api/v1/users/me", () => {
  it("updates permitted display name and avatar with trimmed input", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ displayName: "  Plant Lover  ", avatarUrl: "https://cdn.example.com/avatar.png" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      displayName: "Plant Lover",
      avatarUrl: "https://cdn.example.com/avatar.png",
    });
  });
  it.each([
    ["role", { role: "admin" }],
    ["status", { status: "active" }],
    ["firebaseUid", { firebaseUid: "someone-else" }],
    ["email", { email: "hacker@example.com" }],
    ["userId", { userId: TEST_IDS.other }],
  ])("rejects attempts to change %s", async (field, payload) => {
    const { app, repositories } = buildTestApp();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ displayName: "Valid", ...payload });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0]).toMatchObject({
      location: "body",
      code: "unrecognized_keys",
      keys: [field],
    });
    expect(await repositories.users.findById(TEST_IDS.user)).toMatchObject({
      role: "user",
      status: "active",
      displayName: "user",
    });
  });
  it("rejects overlong name, empty patch, and unsupported historic username writes", async () => {
    const { app } = buildTestApp();
    for (const body of [{ displayName: "a".repeat(101) }, {}, { username: "admin" }]) {
      const res = await request(app)
        .patch("/api/v1/users/me")
        .set(bearer(TEST_TOKENS.user))
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });
  it("allows duplicate display names without treating them as credentials", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ displayName: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("user");
  });
  it("requires authentication before validation", async () => {
    const { app } = buildTestApp();
    const res = await request(app).patch("/api/v1/users/me").send({ role: "admin" });
    expect(res.status).toBe(401);
  });
});
