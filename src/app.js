import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

import { createErrorHandler } from "./common/middlewares/error-handler.js";
import { notFound } from "./common/middlewares/not-found.js";
import { AppError } from "./common/errors/app-error.js";
import { createApiRouter } from "./routes/index.js";

export const API_PREFIX = "/api/v1";
const OPENAPI_PATH = new URL("../docs/openapi.yaml", import.meta.url);
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

// Tái sử dụng X-Request-Id hợp lệ từ client/gateway để trace xuyên hệ thống.
const genRequestId = (req, res) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader("X-Request-Id", id);
  return id;
};

const buildCorsOptions = (allowedOrigins) => ({
  origin(origin, callback) {
    // Mobile app native và công cụ server-to-server không gửi Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(AppError.forbidden("Origin not allowed by CORS"));
  },
  credentials: false,
  exposedHeaders: ["X-Request-Id"],
});

const mountSwagger = (app, logger) => {
  if (!existsSync(OPENAPI_PATH)) {
    logger.warn("docs/openapi.yaml not found; Swagger UI is disabled");
    return;
  }

  try {
    const document = YAML.parse(readFileSync(OPENAPI_PATH, "utf8"));
    // Swagger UI cần inline script/style nên nới CSP riêng cho route này.
    app.use(
      "/api-docs",
      helmet({
        contentSecurityPolicy: { directives: { "script-src": ["'self'", "'unsafe-inline'"] } },
      }),
      swaggerUi.serve,
      swaggerUi.setup(document, { customSiteTitle: "Vegan API Docs" }),
    );
    app.get("/api-docs.json", (_req, res) => res.json(document));
  } catch (error) {
    logger.error({ err: error }, "Failed to load OpenAPI document; Swagger UI is disabled");
  }
};

/**
 * Tạo Express application. Không gọi listen() để Supertest dùng trực tiếp.
 * @param {ReturnType<typeof import("./container.js").createContainer>} container
 */
export const createApp = (container) => {
  const { env, logger } = container;
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy);

  app.use(
    pinoHttp({
      logger,
      genReqId: genRequestId,
      autoLogging: { ignore: (req) => req.url?.startsWith("/api-docs") },
      customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  if (env.swaggerEnabled) mountSwagger(app, logger);

  app.use(helmet());
  app.use(cors(buildCorsOptions(env.corsOrigins)));
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));

  app.use(API_PREFIX, container.apiRateLimiter, createApiRouter(container));

  app.use(notFound);
  app.use(createErrorHandler({ logger, isProduction: env.isProduction }));

  return app;
};
