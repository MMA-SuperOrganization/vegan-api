import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { createContainer } from "../src/container.js";
import { connectRedis, createRedisSupport } from "../src/common/cache/redis.js";
import {
  createStandaloneCoordinator,
  recoverStandaloneOperation,
} from "../src/common/persistence/standalone-coordinator.js";

// Explicit disposable localhost only. Never falls back to the application URI.
const uri = process.env.STANDALONE_TEST_URI;
if (!uri || !/^mongodb:\/\/127\.0\.0\.1:\d+\/\?directConnection=true$/.test(uri))
  throw new Error(
    "Set STANDALONE_TEST_URI to a disposable localhost MongoDB with directConnection=true",
  );
const name = `test_vegan_redis_${randomUUID().replaceAll("-", "")}`;
const logger = { warn() {}, info() {}, error() {} };
const env = loadEnv();
const client = await connectRedis({ config: env.redis, logger });
if (!client) throw new Error("Redis is required");
const prefix = `${env.redis.prefix}:${name}`;
const redis = createRedisSupport({ client, prefix, commandTimeoutMs: env.redis.commandTimeoutMs });
let ownsDatabase = false;
try {
  await mongoose.connect(uri, { dbName: name, autoIndex: false, autoCreate: false });
  assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
  await mongoose.connection.db.collection("_testOwner").insertOne({ _id: name });
  ownsDatabase = true;
  assert.equal((await mongoose.connection.db.admin().command({ hello: 1 })).setName, undefined);
  const standalone = createStandaloneCoordinator({ connection: mongoose.connection, redis });
  const container = createContainer({
    env,
    logger,
    overrides: {
      standalone,
      cache: redis,
      authProvider: null,
      storageProvider: null,
      messagingProvider: null,
      aiProvider: { enabled: false },
    },
  });
  const repository = container.repositories.categories;
  const model = container.models.categories;
  await model.createIndexes();
  const first = await container.transaction(async () =>
    repository.create({ name: "First", slug: "first", type: "food" }),
  );
  await assert.rejects(
    container.transaction(async () => {
      await repository.updateOne({ _id: first._id }, { $set: { name: "Changed" } });
      await repository.create({ name: "Second", slug: "second", type: "food" });
      throw new Error("Injected failure");
    }),
    /Injected failure/,
  );
  assert.equal((await repository.findById(first._id)).name, "First");
  assert.equal(await repository.count({ slug: "second" }), 0);
  await assert.rejects(
    container.transaction(async () => {
      await repository.updateOne(
        { slug: "upsert" },
        { $set: { name: "Upsert", type: "food" } },
        { upsert: true },
      );
      await repository.deleteOne({ _id: first._id });
      throw new Error("Rollback upsert and delete");
    }),
  );
  assert.equal(await repository.count({ slug: "upsert" }), 0);
  assert.equal((await repository.findById(first._id)).name, "First");
  await assert.rejects(
    container.transaction(async () => {
      await repository.create({
        _id: first._id,
        name: "Duplicate",
        slug: "duplicate",
        type: "food",
      });
    }),
  );
  assert.equal((await repository.findById(first._id)).name, "First");
  await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      container.transaction(async () => {
        const before = await repository.findById(first._id);
        await repository.updateOne(
          { _id: first._id },
          { $set: { description: `${before.description ?? ""}${index}` } },
        );
      }),
    ),
  );
  assert.equal((await repository.findById(first._id)).description.length, 6);
  await assert.rejects(
    container.transaction(async () => {
      await repository.updateOne({ _id: first._id }, { $set: { name: "Lease lost" } });
      await client.del(`${prefix}:standalone-lock`);
      await repository.updateOne({ _id: first._id }, { $set: { name: "Must not persist" } });
    }),
    (error) => error.code === "COORDINATION_LOST",
  );
  assert.equal((await repository.findById(first._id)).name, "First");
  const lease = await redis.acquire();
  await client.set(`${prefix}:standalone-lock`, "another-owner", { PX: 1000 });
  await lease.release();
  assert.equal(await client.get(`${prefix}:standalone-lock`), "another-owner");
  await client.del(`${prefix}:standalone-lock`);
  const interruptedId = new mongoose.Types.ObjectId();
  const guard = mongoose.connection.db.collection("_standalone_operation");
  await guard.insertOne({
    _id: "exclusive",
    owner: "crashed-worker",
    state: "running",
    entries: [{ collection: model.collection.name, id: interruptedId, before: null }],
  });
  await model.collection.insertOne({
    _id: interruptedId,
    name: "Interrupted",
    slug: "interrupted",
    type: "food",
  });
  await assert.rejects(
    repository.count({}),
    (error) => error.code === "STANDALONE_RECOVERY_REQUIRED",
  );
  assert.equal(await recoverStandaloneOperation(mongoose.connection), true);
  assert.equal(await repository.count({ slug: "interrupted" }), 0);
  let loads = 0;
  await redis.remember("catalog", async () => {
    loads++;
    return [];
  });
  await redis.remember("catalog", async () => {
    loads++;
    return [];
  });
  assert.equal(loads, 1);
  await repository.updateOne({ _id: first._id }, { $set: { name: "Invalidated" } });
  await redis.remember("catalog", async () => {
    loads++;
    return [];
  });
  assert.equal(loads, 2);
  process.stdout.write(
    "PASS: real standalone + Redis commit, rollback, upsert/delete, duplicate ID, concurrency, crash guard/recovery and cache invalidation.\n",
  );
} finally {
  if (
    ownsDatabase &&
    (await mongoose.connection.db.collection("_testOwner").findOne({ _id: name }))
  )
    await mongoose.connection.dropDatabase();
  if (client.isReady) {
    for await (const keys of client.scanIterator({ MATCH: `${prefix}:*`, COUNT: 100 }))
      if (keys.length) await client.del(keys);
  }
  if (client.isOpen) client.destroy();
  await mongoose.disconnect();
}
