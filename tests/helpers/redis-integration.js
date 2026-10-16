import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import pino from "pino";
import { createApp } from "../../src/app.js";
import { createContainer } from "../../src/container.js";
import { loadEnv } from "../../src/config/env.js";
import { connectRedis, createRedisSupport } from "../../src/common/cache/redis.js";
import { createStandaloneCoordinator } from "../../src/common/persistence/standalone-coordinator.js";
import { createFakeAuthProvider } from "./fakes.js";

export const redisIntegrationEnabled = process.env.RUN_REDIS_INTEGRATION_TESTS === "true";
const logger = pino({ level: "silent" });

export const createRedisIntegrationHarness = async ({ replicaSet = false } = {}) => {
  const uri = process.env[replicaSet ? "REDIS_REPLICA_URI_TEST" : "REDIS_MONGODB_URI_TEST"];
  const url = process.env.REDIS_URL_TEST;
  if (!redisIntegrationEnabled || !url || !/^rediss?:\/\//.test(url ?? ""))
    throw new Error("Explicit Redis integration opt-in and REDIS_URL_TEST are required");
  // Never accept the app database, remote MongoDB, or a caller-supplied DB name.
  if (
    !/^mongodb:\/\/127\.0\.0\.1:\d+\/\?directConnection=true(?:&replicaSet=rs0)?$/.test(uri ?? "")
  )
    throw new Error("Redis integration MongoDB must be disposable localhost with no database name");
  const runId = randomUUID().replaceAll("-", "");
  const database = `test_vegan_redis_${runId}`;
  const prefix = `vegeta-integration:${runId}`;
  const env = loadEnv({ NODE_ENV: "test", LOG_LEVEL: "silent", SWAGGER_ENABLED: "false" });
  let client,
    ownsDatabase = false;
  const cleanupKeys = async () => {
    if (!client?.isReady) return;
    for await (const keys of client.scanIterator({ MATCH: `${prefix}:*`, COUNT: 100 }))
      if (keys.length) await client.del(keys);
  };
  const close = async () => {
    try {
      if (
        ownsDatabase &&
        mongoose.connection.name === database &&
        (await mongoose.connection.db.collection("_redisTestOwner").findOne({ _id: runId }))
      )
        await mongoose.connection.dropDatabase();
    } finally {
      try {
        await cleanupKeys();
      } finally {
        if (client?.isOpen) client.destroy();
        await mongoose.disconnect();
      }
    }
  };
  try {
    await mongoose.connect(uri, {
      dbName: database,
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 5000,
    });
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (Boolean(hello.setName) !== replicaSet)
      throw new Error("Test MongoDB topology does not match suite");
    if ((await mongoose.connection.db.listCollections().toArray()).length)
      throw new Error("Test database must be new");
    await mongoose.connection.db.collection("_redisTestOwner").insertOne({ _id: runId });
    ownsDatabase = true;
    client = await connectRedis({ config: { url }, logger });
    const cache = createRedisSupport({ client, prefix });
    const authProvider = createFakeAuthProvider({
      "redis-admin-token": { firebaseUid: "redis-admin", email: "admin@example.invalid" },
      "redis-user-token": { firebaseUid: "redis-user", email: "user@example.invalid" },
    });
    const worker = ({ coordinated = !replicaSet, support = cache } = {}) => {
      const standalone = coordinated
        ? createStandaloneCoordinator({ connection: mongoose.connection, redis: support })
        : undefined;
      const container = createContainer({
        env,
        logger,
        overrides: {
          cache: support,
          standalone,
          authProvider,
          storageProvider: null,
          messagingProvider: null,
          aiProvider: { enabled: false },
          getDatabaseStatus: () => "connected",
        },
      });
      return { container, app: createApp(container), standalone };
    };
    const primary = worker();
    for (const model of new Set(Object.values(primary.container.models)))
      await model.createCollection();
    await primary.container.models.categories.createIndexes();
    await primary.container.models.users.createIndexes();
    const admin = await primary.container.models.users.create({
      firebaseUid: "redis-admin",
      role: "admin",
      status: "active",
    });
    await primary.container.models.users.create({
      firebaseUid: "redis-user",
      role: "user",
      status: "active",
    });
    return {
      ...primary,
      client,
      cache,
      prefix,
      database,
      admin,
      worker,
      close,
      cleanupKeys,
      connection: mongoose.connection,
      category: (values = {}) =>
        primary.container.models.categories.create({
          name: "Carrot",
          slug: `carrot-${randomUUID()}`,
          type: "food",
          status: "active",
          ...values,
        }),
      async reset() {
        await cleanupKeys();
        await primary.container.models.categories.deleteMany({});
        // Fixture cleanup in the marked disposable DB, bypassing append-only hooks.
        await primary.container.models.auditLogs.collection.deleteMany({});
        await mongoose.connection.db.collection("_standalone_operation").deleteMany({});
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
};

export const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
