import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { loadEnv } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { createContainer } from "./container.js";
import { createReminderScheduler } from "./scheduler/reminder.scheduler.js";

export const startServer = async ({
  env = loadEnv(),
  logger = createLogger(env),
  overrides = {},
} = {}) => {
  if (!overrides.skipDatabaseConnect)
    await connectDatabase({ ...env.database, autoIndex: !env.isProduction, logger });
  const container = createContainer({ env, logger, overrides });
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
    process.stderr.write(
      `${error instanceof Error && error.message.startsWith("Invalid environment") ? error.message : "Startup failed; check configuration and database availability"}\n`,
    );
    await disconnectDatabase().catch(() => {});
    process.exitCode = 1;
  }
}
