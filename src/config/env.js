import { z } from "zod";

const NODE_ENVS = ["development", "test", "production"];
const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"];

// `KEY=` trong file .env cho ra chuỗi rỗng; coi nó như chưa khai báo.
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const withDefault = (schema, fallback) =>
  z.preprocess((value) => (value === undefined || value === "" ? fallback : value), schema);

const envSchema = z
  .object({
    NODE_ENV: withDefault(z.enum(NODE_ENVS), "development"),
    PORT: withDefault(z.coerce.number().int().min(1).max(65535), 3000),
    MONGODB_URI: optionalString,
    CORS_ORIGINS: optionalString,
    LOG_LEVEL: withDefault(z.enum(LOG_LEVELS), "info"),
    TRUST_PROXY: withDefault(z.coerce.number().int().min(0).max(10), 0),
    SWAGGER_ENABLED: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.stringbool().optional(),
    ),

    FIREBASE_PROJECT_ID: optionalString,
    FIREBASE_CLIENT_EMAIL: optionalString,
    FIREBASE_PRIVATE_KEY: optionalString,

    CLOUDFLARE_R2_ACCOUNT_ID: optionalString,
    CLOUDFLARE_R2_ACCESS_KEY_ID: optionalString,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: optionalString,
    CLOUDFLARE_R2_BUCKET_NAME: optionalString,
    CLOUDFLARE_R2_PUBLIC_BASE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.url({ protocol: /^https?$/ }).optional(),
    ),
    CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN: withDefault(
      z.coerce.number().int().min(60).max(3600),
      300,
    ),
  })
  .superRefine((env, ctx) => {
    const requireKey = (key, reason) => {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: `Required ${reason}` });
    };

    if (env.NODE_ENV !== "test") {
      requireKey("MONGODB_URI", "outside test environment");
      requireKey("FIREBASE_PROJECT_ID", "outside test environment");
    }

    // Service account: khai báo đủ cặp email + private key, hoặc bỏ trống cả hai để dùng ADC.
    if (Boolean(env.FIREBASE_CLIENT_EMAIL) !== Boolean(env.FIREBASE_PRIVATE_KEY)) {
      requireKey("FIREBASE_CLIENT_EMAIL", "together with FIREBASE_PRIVATE_KEY");
      requireKey("FIREBASE_PRIVATE_KEY", "together with FIREBASE_CLIENT_EMAIL");
    }

    const r2Keys = [
      "CLOUDFLARE_R2_ACCOUNT_ID",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_R2_BUCKET_NAME",
    ];
    const r2Configured = r2Keys.some((key) => env[key]);
    if (env.NODE_ENV === "production" || r2Configured) {
      r2Keys.forEach((key) =>
        requireKey(key, env.NODE_ENV === "production" ? "in production" : "when R2 is configured"),
      );
    }
  });

const parseOrigins = (value) =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Biến môi trường chỉ giữ được một dòng nên private key thường chứa "\n" dạng literal.
export const normalizePrivateKey = (value) => value?.replace(/\\n/g, "\n");

/**
 * Đọc và validate biến môi trường. Ném lỗi (fail fast) nếu cấu hình không hợp lệ.
 * @param {Record<string, string | undefined>} source
 */
export const loadEnv = (source = process.env) => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
  }

  const env = result.data;
  const isProduction = env.NODE_ENV === "production";

  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    isProduction,
    isTest: env.NODE_ENV === "test",
    port: env.PORT,
    mongodbUri: env.MONGODB_URI,
    corsOrigins: parseOrigins(env.CORS_ORIGINS),
    logLevel: env.LOG_LEVEL,
    trustProxy: env.TRUST_PROXY,
    swaggerEnabled: env.SWAGGER_ENABLED ?? !isProduction,
    firebase: Object.freeze({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    }),
    r2: Object.freeze({
      enabled: Boolean(env.CLOUDFLARE_R2_ACCOUNT_ID),
      accountId: env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: env.CLOUDFLARE_R2_BUCKET_NAME,
      publicBaseUrl: env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.replace(/\/+$/, ""),
      presignedUrlExpiresIn: env.CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN,
    }),
  });
};
