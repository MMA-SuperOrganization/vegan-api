import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { createLogger } from "../src/config/logger.js";
import { connectRedis, createRedisSupport } from "../src/common/cache/redis.js";
import { recoverStandaloneOperation } from "../src/common/persistence/standalone-coordinator.js";

// Quiescence is required: Redis leases cannot prove an old process has stopped.
if (!process.argv.includes("--writers-stopped")) {
  process.stderr.write("Stop all API/scheduler/seed writers, then run with --writers-stopped.\n");
  process.exitCode = 1;
} else {
  let client;
  try {
    const env = loadEnv();
    await connectDatabase({ ...env.database, logger: createLogger(env) });
    client = await connectRedis({ config: env.redis, logger: createLogger(env) });
    if (!client) throw new Error("Redis must be configured before recovery");
    const redis = createRedisSupport({
      client,
      prefix: env.redis.prefix,
      commandTimeoutMs: env.redis.commandTimeoutMs,
    });
    const recovered = await recoverStandaloneOperation(mongoose.connection);
    await redis.invalidate();
    process.stdout.write(
      recovered ? "Standalone operation recovered.\n" : "No unfinished operation.\n",
    );
  } catch {
    process.stderr.write(
      "Recovery failed; guard retained. Check database and Redis availability.\n",
    );
    process.exitCode = 1;
  } finally {
    if (client?.isOpen) client.destroy();
    await disconnectDatabase();
  }
}
