import { describe, expect, it } from "vitest";

import { loadEnv, normalizePrivateKey } from "../../src/config/env.js";

const baseDev = {
  NODE_ENV: "development",
  MONGODB_URI: "mongodb://localhost:27017/vegan",
  FIREBASE_PROJECT_ID: "demo-project",
};

const r2Env = {
  CLOUDFLARE_R2_ACCOUNT_ID: "account",
  CLOUDFLARE_R2_ACCESS_KEY_ID: "key",
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: "secret",
  CLOUDFLARE_R2_BUCKET_NAME: "bucket",
};

describe("loadEnv", () => {
  it("rejects malformed or reversed app versions", () => {
    expect(() =>
      loadEnv({ NODE_ENV: "test", APP_MINIMUM_VERSION: "2.0.0", APP_LATEST_VERSION: "1.9.9" }),
    ).toThrow(/APP_LATEST_VERSION/);
    expect(() => loadEnv({ NODE_ENV: "test", APP_MINIMUM_VERSION: "latest" })).toThrow(
      /APP_MINIMUM_VERSION/,
    );
    expect(
      loadEnv({ NODE_ENV: "test", APP_MINIMUM_VERSION: "1.9.0", APP_LATEST_VERSION: "1.10.0" })
        .publicConfig.latestVersion,
    ).toBe("1.10.0");
  });
  it("applies defaults in test environment without any credentials", () => {
    const env = loadEnv({ NODE_ENV: "test" });

    expect(env).toMatchObject({
      nodeEnv: "test",
      port: 3000,
      isTest: true,
      swaggerEnabled: true,
      r2: { enabled: false, presignedUrlExpiresIn: 300 },
    });
  });

  it("fails fast with a readable message when required variables are missing", () => {
    expect(() => loadEnv({ NODE_ENV: "development" })).toThrow(/MONGODB_URI/);
  });

  it("treats empty strings from .env files as missing", () => {
    expect(() => loadEnv({ ...baseDev, MONGODB_URI: "" })).toThrow(/MONGODB_URI/);
  });

  it("requires every R2 variable in production", () => {
    expect(() => loadEnv({ ...baseDev, NODE_ENV: "production" })).toThrow(
      /CLOUDFLARE_R2_BUCKET_NAME/,
    );
    expect(
      loadEnv({
        ...baseDev,
        ...r2Env,
        NODE_ENV: "production",
        APP_BASE_URL: "https://api.example.com",
        FIREBASE_CLIENT_EMAIL: "svc@demo.iam.gserviceaccount.com",
        FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
      }),
    ).toMatchObject({
      isProduction: true,
      swaggerEnabled: true,
      r2: { enabled: true },
    });
  });

  it("requires a complete R2 configuration once any R2 variable is set", () => {
    expect(() => loadEnv({ ...baseDev, CLOUDFLARE_R2_ACCOUNT_ID: "account" })).toThrow(
      /CLOUDFLARE_R2_ACCESS_KEY_ID/,
    );
  });

  it("requires Firebase client email and private key together", () => {
    expect(() =>
      loadEnv({ ...baseDev, FIREBASE_CLIENT_EMAIL: "svc@demo.iam.gserviceaccount.com" }),
    ).toThrow(/FIREBASE_PRIVATE_KEY/);
  });

  it("parses the CORS whitelist and normalizes the private key", () => {
    const env = loadEnv({
      ...baseDev,
      CORS_ORIGINS: "http://localhost:8081, https://app.example.com ,",
      FIREBASE_CLIENT_EMAIL: "svc@demo.iam.gserviceaccount.com",
      FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    });

    expect(env.corsOrigins).toEqual(["http://localhost:8081", "https://app.example.com"]);
    expect(env.firebase.privateKey).toBe(
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    );
  });

  it("rejects invalid values", () => {
    expect(() => loadEnv({ ...baseDev, PORT: "abc" })).toThrow(/PORT/);
    expect(() => loadEnv({ ...baseDev, CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN: "86400" })).toThrow(
      /EXPIRES_IN/,
    );
  });
});

describe("normalizePrivateKey", () => {
  it("leaves real newlines untouched and handles undefined", () => {
    expect(normalizePrivateKey("a\nb")).toBe("a\nb");
    expect(normalizePrivateKey(undefined)).toBeUndefined();
  });

  it("rebuilds a canonical PEM from dashboard-pasted variants", () => {
    const body = "A".repeat(70);
    const expected = `-----BEGIN PRIVATE KEY-----\n${"A".repeat(64)}\nAAAAAA\n-----END PRIVATE KEY-----\n`;
    const variants = [
      `"-----BEGIN PRIVATE KEY-----\\n${body}\\n-----END PRIVATE KEY-----\\n"`,
      `'-----BEGIN PRIVATE KEY-----\\n${body}\\n-----END PRIVATE KEY-----\\n'`,
      `-----BEGIN PRIVATE KEY-----\\\\n${body}\\\\n-----END PRIVATE KEY-----\\\\n`,
      `-----BEGIN PRIVATE KEY-----\r\n${body}\r\n-----END PRIVATE KEY-----\r\n`,
      `-----BEGIN PRIVATE KEY----- ${body} -----END PRIVATE KEY-----`,
      Buffer.from(`-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`).toString(
        "base64",
      ),
    ];
    for (const variant of variants) expect(normalizePrivateKey(variant)).toBe(expected);
  });
});
