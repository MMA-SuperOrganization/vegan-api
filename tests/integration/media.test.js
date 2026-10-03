import request from "supertest";
import { describe, expect, it } from "vitest";
import { bearer, buildTestApp, TEST_TOKENS, TEST_IDS } from "../helpers/test-app.js";
const validBody = {
  purpose: "avatar",
  mimeType: "image/webp",
  filename: "../../etc/passwd my avatar.webp",
  sizeBytes: 204800,
};
describe("POST /api/v1/media/upload-requests", () => {
  it("requires authentication", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/api/v1/media/upload-requests").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_MISSING");
  });
  it("returns pending asset ID and a presigned URL with a safe namespaced key", async () => {
    const { app, storageProvider, repositories } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    const asset = await repositories.mediaAssets.findById(data.assetId);
    expect(asset.objectKey).toMatch(
      new RegExp(`^users/${TEST_IDS.user}/avatar/2026-10-03/[0-9a-f-]{36}\\.webp$`),
    );
    expect(asset.objectKey).not.toContain("passwd");
    expect(asset.status).toBe("pending");
    expect(asset.ownerId).toBe(TEST_IDS.user);
    expect(data).toMatchObject({
      method: "PUT",
      status: "pending",
      expiresIn: 300,
      requiredHeaders: { "Content-Type": "image/webp", "Content-Length": "204800" },
    });
    expect(data.uploadUrl).toContain(asset.objectKey);
    expect(data.objectKey).toBeUndefined();
    expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(JSON.stringify(data)).not.toMatch(/secret|accessKey/i);
    expect(storageProvider.calls[0]).toMatchObject({
      key: asset.objectKey,
      contentType: "image/webp",
      contentLength: 204800,
    });
  });
  it("rejects MIME types outside whitelist", async () => {
    const { app, storageProvider } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, mimeType: "application/x-msdownload" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0]).toMatchObject({ location: "body", path: "mimeType" });
    expect(storageProvider.calls).toHaveLength(0);
  });
  it("rejects video MIME for an image-only purpose", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, mimeType: "video/mp4" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("rejects files larger than the configured limit", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, sizeBytes: 50 * 1024 * 1024 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("size limit");
  });
  it("rejects client-selected object keys", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send({ ...validBody, objectKey: "users/other/avatar/hijack.webp" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("returns 503 when storage is not configured", async () => {
    const { app } = buildTestApp({ overrides: { storageProvider: null } });
    const res = await request(app)
      .post("/api/v1/media/upload-requests")
      .set(bearer(TEST_TOKENS.user))
      .send(validBody);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
  });
});
