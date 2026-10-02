import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { loadEnv } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { createContainer } from "./container.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const bootstrap = async () => {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    // Logger chưa tạo được khi env sai, in thẳng ra stderr rồi thoát.
    console.error(error.message);
    process.exit(1);
  }

  const logger = createLogger(env);

  try {
    const container = createContainer({ env, logger });
    await connectDatabase({ uri: env.mongodbUri, autoIndex: !env.isProduction, logger });

    const app = createApp(container);
    const server = createServer(app);

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(env.port, resolve);
    });
    logger.info(
      { port: env.port, env: env.nodeEnv },
      `Server listening on http://localhost:${env.port}`,
    );

    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info({ signal }, "Shutting down gracefully");

      const forceExit = setTimeout(() => {
        logger.error("Graceful shutdown timed out, forcing exit");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();

      try {
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        server.closeIdleConnections();
        await disconnectDatabase();
        logger.info("Shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, "Error during shutdown");
        process.exit(1);
      }
    };

    // Ngừng nhận kết nối mới; keep-alive idle được đóng ngay để server.close() không bị treo.
    const onSignal = (signal) => {
      server.closeIdleConnections();
      void shutdown(signal);
    };
    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);

    process.on("unhandledRejection", (reason) => {
      logger.fatal({ err: reason }, "Unhandled promise rejection");
      void shutdown("unhandledRejection");
    });
    process.on("uncaughtException", (error) => {
      logger.fatal({ err: error }, "Uncaught exception");
      void shutdown("uncaughtException");
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    await disconnectDatabase().catch(() => {});
    // Chờ pino flush log trước khi thoát.
    logger.flush?.();
    setTimeout(() => process.exit(1), 100);
  }
};

await bootstrap();
