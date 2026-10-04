import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import {
  createDebugHttpLogger,
  isDebugHttpLogEnabled,
} from "./common/middlewares/debug-http-logger.js";
import { createErrorHandler } from "./common/middlewares/error-handler.js";
import { notFound } from "./common/middlewares/not-found.js";
import { AppError } from "./common/errors/app-error.js";
import { createApiRouter } from "./routes/index.js";

export const API_PREFIX = "/api/v1";
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;
export const createApp = (container) => {
  const { env, logger } = container;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy);
  app.use((req, res, next) => {
    const value = req.headers["x-request-id"];
    req.id = typeof value === "string" && REQUEST_ID_PATTERN.test(value) ? value : randomUUID();
    res.locals.requestId = req.id;
    res.setHeader("X-Request-Id", req.id);
    next();
  });
  // Dev-only: in chi tiết request/response dạng khối đẹp khi LOG_LEVEL=debug|trace.
  if (isDebugHttpLogEnabled(env)) app.use(createDebugHttpLogger());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url?.split("?")[0] }),
        res: (res) => ({ statusCode: res.statusCode }),
        err: (err) => ({ type: err.name, code: err.code, message: "Request processing failed" }),
      },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, done) =>
        !origin || env.corsOrigins.includes(origin)
          ? done(null, true)
          : done(AppError.forbidden("Origin not allowed by CORS")),
      exposedHeaders: ["X-Request-Id"],
      credentials: false,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: env.jsonBodyLimit }));
  app.use(container.apiRateLimiter);
  if (env.swaggerEnabled) {
    const spec = YAML.parse(readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8"));
    // Swagger Try it out follows the configured mount, including deployments
    // that do not use the default /api/v1 prefix.
    spec.servers[0].url = env.apiPrefix;
    spec.servers[1].variables.apiPrefix.default = env.apiPrefix;
    app.get("/api-docs/openapi.yaml", (_req, res) =>
      res.type("application/yaml").send(YAML.stringify(spec)),
    );
    app.get("/api-docs.json", (_req, res) => res.json(spec));
    app.use(
      "/api-docs",
      helmet({
        contentSecurityPolicy: {
          directives: {
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
          },
        },
      }),
      swaggerUi.serve,
      swaggerUi.setup(spec),
    );
  }
  const router = createApiRouter(container);
  app.locals.businessRoutes = router.registeredOperations;
  app.use(env.apiPrefix, router);
  app.use(notFound);
  app.use(createErrorHandler({ logger, isProduction: env.isProduction }));
  return app;
};
