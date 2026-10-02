import request from "supertest";
import { describe, expect, it } from "vitest";

import { bearer, buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";

const validBody = {
  context: "AVATAR",
  contentType: "image/webp",
  originalFileName: "../../etc/passwd my avatar.webp",
  fileSize: 204_800,
};

describe("POST /api/v1/media/upload-url", () => {
  it("requires authentication", async () => {
    const { app } = buildTestApp();

    const res = await request(app).post("/api/v1/media/upload-requests").send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_MISSING");
  });

  it("returns a presigned upload URL with a safe, namespaced object key", async () => {
    const { app, storageProvider, userRepository } = buildTestApp();
    const user = await userRepository.findByFirebaseUid("uid-user");

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send(validBody);

    if (res.status === 500) console.log("DEBUG 500:", res.body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.objectKey).toMatch(new RegExp(`^users/${user._id}/avatars/[0-9a-f-]{36}\\.webp$`));
    expect(data.objectKey).not.toContain("passwd");
    expect(data).toMatchObject({
      method: "PUT",
      expiresIn: 300,
      headers: { "Content-Type": "image/webp", "Content-Length": "204800" },
    });
    expect(data.uploadUrl).toContain(data.objectKey);
    expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(JSON.stringify(data)).not.toMatch(/secret|accessKey/i);

    expect(storageProvider.calls[0]).toMatchObject({
      key: data.objectKey,
      contentType: "image/webp",
      contentLength: 204_800,
    });
  });

  it("rejects a MIME type outside the whitelist", async () => {
    const { app, storageProvider } = buildTestApp();

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, contentType: "application/x-msdownload" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors[0]).toMatchObject({ location: "body", path: "contentType" });
    expect(storageProvider.calls).toHaveLength(0);
  });

  it("rejects a MIME type not allowed for the context", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, context: "AVATAR", contentType: "video/mp4" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].path).toBe("contentType");
  });

  it("rejects files larger than the limit", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, fileSize: 50 * 1024 * 1024 });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].path).toBe("fileSize");
  });

  it("rejects unknown fields", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, objectKey: "users/other/avatars/hijack.webp" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 503 when storage is not configured", async () => {
    const { app } = buildTestApp({ overrides: { storageProvider: null } });

    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send(validBody);

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("SERVICE_UNAVAILABLE");
  });
});
