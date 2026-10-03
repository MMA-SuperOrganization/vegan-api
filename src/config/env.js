import { z } from "zod";

const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().optional(),
);
const integer = (fallback, min = 1, max = 1_000_000_000) =>
  z.preprocess(
    (v) => (v === undefined || v === "" ? fallback : v),
    z.coerce.number().int().min(min).max(max),
  );
const boolean = (fallback) =>
  z.preprocess(
    (v) => (v === undefined || v === "" ? fallback : v),
    z.union([z.boolean(), z.stringbool()]),
  );
const supplied = (value) => Boolean(value && !value.includes("CHANGE_ME"));
export const normalizePrivateKey = (value) => value?.replace(/\\n/g, "\n");

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: integer(3000, 1, 65535),
    API_PREFIX: z
      .string()
      .regex(/^\/[\w/-]+$/)
      .default("/api/v1"),
    APP_NAME: z.string().min(1).max(100).default("vegan-support-api"),
    APP_BASE_URL: z.url().default("http://localhost:3000"),
    TRUST_PROXY: integer(0, 0, 10),
    SHUTDOWN_TIMEOUT_MS: integer(10000, 100, 120000),
    JSON_BODY_LIMIT: z
      .string()
      .regex(/^\d+(?:b|kb|mb)$/i)
      .default("1mb"),
    CORS_ORIGINS: optional,
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    MONGODB_URI: optional,
    MONGODB_DB_NAME: z
      .string()
      .regex(/^[\w-]+$/)
      .default("vegan_support"),
    MONGODB_MIN_POOL_SIZE: integer(1, 0, 1000),
    MONGODB_MAX_POOL_SIZE: integer(10, 1, 1000),
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: integer(10000, 100, 120000),
    FIREBASE_PROJECT_ID: optional,
    FIREBASE_CLIENT_EMAIL: optional,
    FIREBASE_PRIVATE_KEY: optional,
    FCM_ENABLED: boolean(false),
    CLOUDFLARE_R2_ACCOUNT_ID: optional,
    CLOUDFLARE_R2_ACCESS_KEY_ID: optional,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: optional,
    CLOUDFLARE_R2_BUCKET_NAME: optional,
    CLOUDFLARE_R2_PUBLIC_BASE_URL: optional,
    CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN: integer(300, 60, 3600),
    CLOUDFLARE_R2_MAX_IMAGE_SIZE_BYTES: integer(10485760, 1024, 104857600),
    CLOUDFLARE_R2_MAX_VIDEO_SIZE_BYTES: integer(524288000, 1024, 2147483648),
    AI_ENABLED: boolean(false),
    AI_PROVIDER: z.literal("openai-compatible").default("openai-compatible"),
    AI_BASE_URL: optional,
    AI_API_KEY: optional,
    AI_CHAT_MODEL: optional,
    AI_VISION_MODEL: optional,
    AI_TIMEOUT_MS: integer(30000, 100, 300000),
    AI_MAX_RETRIES: integer(1, 0, 3),
    REMINDER_SCHEDULER_ENABLED: boolean(false),
    REMINDER_POLL_INTERVAL_MS: integer(60000, 100, 3600000),
    REMINDER_BATCH_SIZE: integer(50, 1, 500),
    REMINDER_LOCK_TTL_MS: integer(120000, 1000, 3600000),
    RATE_LIMIT_WINDOW_MS: integer(900000, 100, 86400000),
    RATE_LIMIT_MAX: integer(200, 1, 100000),
    AUTH_RATE_LIMIT_MAX: integer(30, 1, 100000),
    UPLOAD_RATE_LIMIT_MAX: integer(30, 1, 100000),
    AI_RATE_LIMIT_MAX: integer(20, 1, 100000),
    SWAGGER_ENABLED: boolean(true),
    SEED_ADMIN_FIREBASE_UID: optional,
    SEED_ADMIN_EMAIL: optional,
  })
  .superRefine((env, ctx) => {
    const issue = (key, message) => ctx.addIssue({ code: "custom", path: [key], message });
    const requireReal = (key) => {
      if (!supplied(env[key])) issue(key, "Replace placeholder with a valid configuration value");
    };
    if (env.NODE_ENV !== "test") requireReal("MONGODB_URI");
    if (supplied(env.MONGODB_URI) && !/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI))
      issue("MONGODB_URI", "Expected a MongoDB connection URI");
    if (env.NODE_ENV === "production" || env.FCM_ENABLED) {
      ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].forEach(requireReal);
    }
    const firebasePair = ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].map((key) =>
      supplied(env[key]),
    );
    if (firebasePair[0] !== firebasePair[1])
      issue(
        "FIREBASE_PRIVATE_KEY",
        "Service account email and private key must both be configured",
      );
    const r2Keys = [
      "CLOUDFLARE_R2_ACCOUNT_ID",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_R2_BUCKET_NAME",
    ];
    if (env.NODE_ENV === "production" || r2Keys.some((key) => supplied(env[key])))
      r2Keys.forEach(requireReal);
    if (env.AI_ENABLED)
      ["AI_BASE_URL", "AI_API_KEY", "AI_CHAT_MODEL", "AI_VISION_MODEL"].forEach(requireReal);
    for (const key of ["AI_BASE_URL", "CLOUDFLARE_R2_PUBLIC_BASE_URL", "APP_BASE_URL"]) {
      if (!supplied(env[key])) continue;
      try {
        const url = new URL(env[key]);
        if (
          url.username ||
          url.password ||
          (url.protocol !== "https:" &&
            !(
              env.NODE_ENV !== "production" &&
              url.protocol === "http:" &&
              ["localhost", "127.0.0.1"].includes(url.hostname)
            ))
        )
          issue(key, "Expected HTTPS URL; localhost HTTP is development-only");
      } catch {
        issue(key, "Expected a valid URL");
      }
    }
    if (env.MONGODB_MIN_POOL_SIZE > env.MONGODB_MAX_POOL_SIZE)
      issue("MONGODB_MIN_POOL_SIZE", "Minimum pool exceeds maximum");
    if (env.REMINDER_LOCK_TTL_MS < env.REMINDER_POLL_INTERVAL_MS)
      issue("REMINDER_LOCK_TTL_MS", "Lock TTL must be at least the poll interval");
    const origins = (env.CORS_ORIGINS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (origins.includes("*")) issue("CORS_ORIGINS", "Wildcard origins are not allowed");
    for (const origin of origins) {
      try {
        if (new URL(origin).origin !== origin)
          issue("CORS_ORIGINS", "Origins must not include paths");
      } catch {
        issue("CORS_ORIGINS", "Invalid origin");
      }
    }
  });

export const loadEnv = (source = process.env) => {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success)
    throw new Error(
      `Invalid environment configuration:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  const e = parsed.data;
  return Object.freeze({
    nodeEnv: e.NODE_ENV,
    isProduction: e.NODE_ENV === "production",
    isTest: e.NODE_ENV === "test",
    port: e.PORT,
    apiPrefix: e.API_PREFIX,
    appName: e.APP_NAME,
    appBaseUrl: e.APP_BASE_URL,
    trustProxy: e.TRUST_PROXY,
    shutdownTimeoutMs: e.SHUTDOWN_TIMEOUT_MS,
    jsonBodyLimit: e.JSON_BODY_LIMIT,
    corsOrigins: (e.CORS_ORIGINS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    logLevel: e.LOG_LEVEL,
    swaggerEnabled: e.SWAGGER_ENABLED,
    mongodbUri: e.MONGODB_URI,
    database: {
      uri: e.MONGODB_URI,
      dbName: e.MONGODB_DB_NAME,
      minPoolSize: e.MONGODB_MIN_POOL_SIZE,
      maxPoolSize: e.MONGODB_MAX_POOL_SIZE,
      serverSelectionTimeoutMs: e.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    },
    firebase: {
      enabled:
        supplied(e.FIREBASE_PROJECT_ID) &&
        supplied(e.FIREBASE_CLIENT_EMAIL) &&
        supplied(e.FIREBASE_PRIVATE_KEY),
      projectId: e.FIREBASE_PROJECT_ID,
      clientEmail: e.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(e.FIREBASE_PRIVATE_KEY),
    },
    fcmEnabled: e.FCM_ENABLED,
    r2: {
      enabled: supplied(e.CLOUDFLARE_R2_ACCOUNT_ID),
      accountId: e.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: e.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: e.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: e.CLOUDFLARE_R2_BUCKET_NAME,
      publicBaseUrl: supplied(e.CLOUDFLARE_R2_PUBLIC_BASE_URL)
        ? e.CLOUDFLARE_R2_PUBLIC_BASE_URL.replace(/\/+$/, "")
        : undefined,
      presignedUrlExpiresIn: e.CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN,
      maxImageSizeBytes: e.CLOUDFLARE_R2_MAX_IMAGE_SIZE_BYTES,
      maxVideoSizeBytes: e.CLOUDFLARE_R2_MAX_VIDEO_SIZE_BYTES,
    },
    ai: {
      enabled: e.AI_ENABLED,
      provider: e.AI_PROVIDER,
      baseUrl: e.AI_BASE_URL,
      apiKey: e.AI_API_KEY,
      chatModel: e.AI_CHAT_MODEL,
      visionModel: e.AI_VISION_MODEL,
      timeoutMs: e.AI_TIMEOUT_MS,
      maxRetries: e.AI_MAX_RETRIES,
    },
    scheduler: {
      enabled: e.REMINDER_SCHEDULER_ENABLED,
      pollIntervalMs: e.REMINDER_POLL_INTERVAL_MS,
      batchSize: e.REMINDER_BATCH_SIZE,
      lockTtlMs: e.REMINDER_LOCK_TTL_MS,
    },
    rateLimits: {
      windowMs: e.RATE_LIMIT_WINDOW_MS,
      max: e.RATE_LIMIT_MAX,
      authMax: e.AUTH_RATE_LIMIT_MAX,
      uploadMax: e.UPLOAD_RATE_LIMIT_MAX,
      aiMax: e.AI_RATE_LIMIT_MAX,
    },
    seed: { adminFirebaseUid: e.SEED_ADMIN_FIREBASE_UID, adminEmail: e.SEED_ADMIN_EMAIL },
  });
};
