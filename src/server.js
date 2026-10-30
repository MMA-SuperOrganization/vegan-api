import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { loadEnv } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { createContainer } from "./container.js";
import { createReminderScheduler } from "./scheduler/reminder.scheduler.js";
import mongoose from "mongoose";
import { connectRedis, createRedisSupport } from "./common/cache/redis.js";
import {
  createStandaloneCoordinator,
  recoverStandaloneOperation,
} from "./common/persistence/standalone-coordinator.js";

export const startServer = async ({
  env = loadEnv(),
  logger = createLogger(env),
  overrides = {},
} = {}) => {
  if (!overrides.skipDatabaseConnect)
    await connectDatabase({ ...env.database, autoIndex: !env.isProduction, logger });
  const redisClient = await connectRedis({ config: env.redis, logger });
  const cache = redisClient
    ? createRedisSupport({
        client: redisClient,
        prefix: env.redis.prefix,
        ttlSeconds: env.redis.ttlSeconds,
        commandTimeoutMs: env.redis.commandTimeoutMs,
      })
    : undefined;
  let standalone;
  if ((env.standaloneRedisEnabled || cache) && !overrides.skipDatabaseConnect) {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      if (cache) {
        const lease = await cache.acquire();
        try {
          if (await recoverStandaloneOperation(mongoose.connection)) {
            await cache.invalidate();
            logger.warn("Recovered unfinished standalone database operation on startup");
          }
        } finally {
          await lease.release();
        }
        standalone = createStandaloneCoordinator({ connection: mongoose.connection, redis: cache });
      }
      logger.warn("MongoDB standalone uses serialized operations with compensating rollback");
    }
  }
  const container = createContainer({
    env,
    logger,
    overrides: { cache, standalone, ...overrides },
  });
  const app = createApp(container);
  const server = createServer(app);
  const scheduler = createReminderScheduler({
    remindersService: container.services.reminders,
    env,
    logger,
    clock: container.clock,
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.port, resolve);
  });
  scheduler.start();
  logger.info({ port: server.address().port }, "Server listening");
  let stopping;
  const stop = (reason = "shutdown") => {
    if (stopping) return stopping;
    stopping = (async () => {
      logger.info({ reason }, "Shutting down");
      let timer;
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          server.closeAllConnections();
          container.storageProvider?.destroy?.();
          reject(
            Object.assign(new Error("Shutdown deadline exceeded"), { code: "SHUTDOWN_TIMEOUT" }),
          );
        }, env.shutdownTimeoutMs);
      });
      const cleanup = async () => {
        const closeServer = new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        server.closeIdleConnections();
        await scheduler.stop();
        await closeServer;
        if (!overrides.skipDatabaseConnect) await disconnectDatabase();
        if (redisClient?.isOpen) redisClient.destroy();
        container.storageProvider?.destroy?.();
      };
      try {
        await Promise.race([cleanup(), deadline]);
      } finally {
        clearTimeout(timer);
      }
    })();
    return stopping;
  };
  return { app, server, container, scheduler, stop };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let runtime;
  try {
    runtime = await startServer();
    const shutdown = (reason, failed = false) =>
      runtime
        .stop(reason)
        .then(() => {
          process.exitCode = failed ? 1 : 0;
        })
        .catch((error) => {
          process.exitCode = 1;
          if (error.code === "SHUTDOWN_TIMEOUT") {
            runtime.container.logger.fatal({ code: error.code }, "Forced shutdown after deadline");
            process.exit(1);
          }
        });
    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });
    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.once("unhandledRejection", () => {
      runtime.container.logger.fatal("Unhandled promise rejection");
      void shutdown("unhandledRejection", true);
    });
    process.once("uncaughtException", () => {
      runtime.container.logger.fatal("Uncaught exception");
      void shutdown("uncaughtException", true);
    });
  } catch (error) {
    const isEnvError = error instanceof Error && error.message.startsWith("Invalid environment");
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`.replace(/\/\/[^@/\s]+@/g, "//[REDACTED]@")
        : String(error);
    process.stderr.write(
      `${isEnvError ? error.message : `Startup failed; check configuration and database availability\n  cause: ${detail}`}\n`,
    );
    await disconnectDatabase().catch(() => {});
    process.exitCode = 1;
  }
}
