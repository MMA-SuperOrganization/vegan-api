import mongoose from "mongoose";
import { loadEnv } from "../../src/config/env.js";
import { createContainer } from "../../src/container.js";
import { connectRedis, createRedisSupport } from "../../src/common/cache/redis.js";
import { createStandaloneCoordinator } from "../../src/common/persistence/standalone-coordinator.js";

const [database, prefix, id] = process.argv.slice(2);
let client;
try {
  if (
    process.env.RUN_REDIS_INTEGRATION_TESTS !== "true" ||
    !/^test_vegan_redis_[a-f0-9]{32}$/.test(database) ||
    prefix !== `vegeta-integration:${database.slice("test_vegan_redis_".length)}` ||
    !/^mongodb:\/\/127\.0\.0\.1:\d+\/\?directConnection=true$/.test(
      process.env.REDIS_MONGODB_URI_TEST ?? "",
    )
  )
    throw new Error("Unsafe test worker target");
  await mongoose.connect(process.env.REDIS_MONGODB_URI_TEST, {
    dbName: database,
    autoCreate: false,
    autoIndex: false,
  });
  if (
    !(await mongoose.connection.db
      .collection("_redisTestOwner")
      .findOne({ _id: database.slice("test_vegan_redis_".length) }))
  )
    throw new Error("Test database owner marker missing");
  client = await connectRedis({
    config: { url: process.env.REDIS_URL_TEST },
    logger: { warn() {} },
  });
  const cache = createRedisSupport({ client, prefix, lockTtlMs: 5000 });
  const standalone = createStandaloneCoordinator({ connection: mongoose.connection, redis: cache });
  const container = createContainer({
    env: loadEnv({ NODE_ENV: "test" }),
    logger: { info() {}, warn() {}, error() {} },
    overrides: {
      cache,
      standalone,
      authProvider: null,
      storageProvider: null,
      messagingProvider: null,
      aiProvider: { enabled: false },
    },
  });
  await container.transaction(async () => {
    await container.repositories.categories.updateOne(
      { _id: id },
      { $set: { name: "Interrupted process write" } },
    );
    process.send?.("written");
    await new Promise(() => {});
  });
} catch {
  process.send?.("failed");
  if (client?.isOpen) client.destroy();
  await mongoose.disconnect();
  process.exitCode = 1;
}
