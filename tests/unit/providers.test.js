import { PutObjectCommand } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { createR2Client } from "../../src/config/r2.js";
import { createFirebaseAuthProvider } from "../../src/providers/firebase/firebase-auth.provider.js";
import { createR2StorageProvider } from "../../src/providers/r2/r2-storage.provider.js";

describe("Firebase auth provider", () => {
  const firebaseError = (code) => Object.assign(new Error(code), { code });

  it("normalizes a decoded token", async () => {
    const firebaseAuth = {
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: "uid-1",
        email: "User@Example.com",
        email_verified: true,
        auth_time: 1_700_000_000,
      }),
    };
    const provider = createFirebaseAuthProvider({ firebaseAuth });

    await expect(provider.verifyIdToken("token")).resolves.toEqual({
      firebaseUid: "uid-1",
      email: "user@example.com",
      emailVerified: true,
      displayName: null,
      avatarUrl: null,
      authTime: new Date(1_700_000_000_000),
    });
    expect(firebaseAuth.verifyIdToken).toHaveBeenCalledWith("token", true);
  });

  it.each([
    ["auth/id-token-expired", 401, "TOKEN_EXPIRED"],
    ["auth/id-token-revoked", 401, "TOKEN_REVOKED"],
    ["auth/user-disabled", 403, "ACCOUNT_DISABLED"],
    ["auth/argument-error", 401, "TOKEN_INVALID"],
    ["auth/something-new", 401, "TOKEN_INVALID"],
    ["app/network-error", 503, "AUTH_PROVIDER_ERROR"],
  ])("maps %s to %i %s", async (code, statusCode, appCode) => {
    const provider = createFirebaseAuthProvider({
      firebaseAuth: { verifyIdToken: vi.fn().mockRejectedValue(firebaseError(code)) },
    });

    await expect(provider.verifyIdToken("token")).rejects.toMatchObject({
      statusCode,
      code: appCode,
    });
  });
});

describe("R2 storage provider", () => {
  const s3Client = createR2Client({
    accountId: "acc123",
    accessKeyId: "AKIAFAKE",
    secretAccessKey: "fake-secret",
  });

  it("configures the S3 client for R2", async () => {
    expect(await s3Client.config.region()).toBe("auto");
    const endpoint = await s3Client.config.endpoint();
    expect(endpoint.hostname).toBe("acc123.r2.cloudflarestorage.com");
  });

  it("signs a real PUT URL locally with content type and expiry, without exposing the secret", async () => {
    const provider = createR2StorageProvider({
      s3Client,
      bucketName: "bucket",
      defaultExpiresIn: 300,
      now: () => 0,
    });

    const { url, expiresAt } = await provider.createUploadUrl({
      key: "users/u1/avatars/x.webp",
      contentType: "image/webp",
      contentLength: 10,
    });
    const parsed = new URL(url);

    expect(parsed.hostname).toBe("bucket.acc123.r2.cloudflarestorage.com");
    expect(parsed.pathname).toBe("/users/u1/avatars/x.webp");
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(parsed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
    expect(parsed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(url).not.toContain("fake-secret");
    expect(expiresAt).toEqual(new Date(300_000));
  });

  it("passes bucket, key and content type to the signer", async () => {
    const signUrl = vi.fn().mockResolvedValue("https://signed");
    const provider = createR2StorageProvider({
      s3Client,
      bucketName: "bucket",
      defaultExpiresIn: 120,
      signUrl,
    });

    await provider.createUploadUrl({ key: "k", contentType: "image/png" });

    const [, command, options] = signUrl.mock.calls[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({ Bucket: "bucket", Key: "k", ContentType: "image/png" });
    expect(options).toMatchObject({ expiresIn: 120 });
    expect(options.signableHeaders).toEqual(new Set(["content-type"]));
  });

  it("wraps SDK failures in STORAGE_PROVIDER_ERROR", async () => {
    const provider = createR2StorageProvider({
      s3Client: {
        send: vi
          .fn()
          .mockRejectedValue(
            Object.assign(new Error("AccessDenied"), { $metadata: { httpStatusCode: 403 } }),
          ),
      },
      bucketName: "bucket",
      defaultExpiresIn: 300,
    });

    await expect(provider.deleteObject("k")).rejects.toMatchObject({
      statusCode: 503,
      code: "STORAGE_PROVIDER_ERROR",
    });
  });

  it("returns null metadata for missing objects", async () => {
    const provider = createR2StorageProvider({
      s3Client: {
        send: vi.fn().mockRejectedValue(
          Object.assign(new Error("NotFound"), {
            name: "NotFound",
            $metadata: { httpStatusCode: 404 },
          }),
        ),
      },
      bucketName: "bucket",
      defaultExpiresIn: 300,
    });

    await expect(provider.getObjectMetadata("k")).resolves.toBeNull();
  });

  it("builds public URLs only when a public base URL is configured", () => {
    expect(
      createR2StorageProvider({
        s3Client,
        bucketName: "b",
        defaultExpiresIn: 300,
        publicBaseUrl: "https://cdn.example.com",
      }).getPublicUrl("a/b.jpg"),
    ).toBe("https://cdn.example.com/a/b.jpg");
    expect(
      createR2StorageProvider({ s3Client, bucketName: "b", defaultExpiresIn: 300 }).getPublicUrl(
        "a/b.jpg",
      ),
    ).toBeNull();
  });
});
