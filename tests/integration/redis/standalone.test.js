import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { setTimeout as delay } from "node:timers/promises";
import mongoose from "mongoose";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRedisSupport } from "../../../src/common/cache/redis.js";
import { recoverStandaloneOperation } from "../../../src/common/persistence/standalone-coordinator.js";
import {
  createRedisIntegrationHarness,
  deferred,
  redisIntegrationEnabled,
} from "../../helpers/redis-integration.js";

describe.skipIf(!redisIntegrationEnabled)(
  "real Redis + MongoDB standalone compensation",
  { timeout: 30000, hookTimeout: 30000 },
  () => {
    let h;
    const repo = () => h.container.repositories.categories;
    const guard = () => h.connection.db.collection("_standalone_operation");
    const fail = () => {
      throw new Error("Injected failure");
    };
    beforeAll(async () => {
      h = await createRedisIntegrationHarness();
    });
    afterEach(async () => {
      vi.restoreAllMocks();
      await h?.reset();
    });
    afterAll(async () => {
      await h?.close();
    });

    it("commits a multi-document workflow and removes its durable guard", async () => {
      await h.container.transaction(async () => {
        await repo().create({ name: "One", slug: "one", type: "food" });
        await repo().create({ name: "Two", slug: "two", type: "food" });
      });
      expect(await repo().count({})).toBe(2);
      expect(await guard().countDocuments({})).toBe(0);
    });
    it("restores repeated updates, deleted documents and new upserts on failure", async () => {
      const first = await h.category();
      const before = await h.container.models.categories.collection.findOne({ _id: first._id });
      await expect(
        h.container.transaction(async () => {
          await repo().updateOne({ _id: first._id }, { $set: { name: "Changed" } });
          await repo().updateOne({ _id: first._id }, { $set: { name: "Changed twice" } });
          await repo().deleteOne({ _id: first._id });
          await repo().updateOne(
            { slug: "upsert" },
            { $set: { name: "New", type: "food" } },
            { upsert: true },
          );
          fail();
        }),
      ).rejects.toThrow("Injected failure");
      expect(await h.container.models.categories.collection.findOne({ _id: first._id })).toEqual(
        before,
      );
      expect(await repo().count({ slug: "upsert" })).toBe(0);
    });
    it("preserves select:false FCM tokens and unknown stored fields during user rollback", async () => {
      const users = h.container.models.users;
      await users.collection.updateOne(
        { _id: h.admin._id },
        {
          $set: {
            fcmTokens: [
              { tokenId: "test-device", token: "synthetic-test-token", platform: "android" },
            ],
            fcmTokensVersion: 7,
            legacyPrivateField: { retain: true },
          },
        },
      );
      const before = await users.collection.findOne({ _id: h.admin._id });
      await expect(
        h.container.transaction(async () => {
          await h.container.repositories.users.updateOne(
            { _id: h.admin._id },
            { $set: { displayName: "Changed" } },
          );
          fail();
        }),
      ).rejects.toThrow("Injected failure");
      expect(await users.collection.findOne({ _id: h.admin._id })).toEqual(before);
    });
    it("rolls back exactly the document selected by a sorted update", async () => {
      await h.category({ name: "First", sortOrder: 1 });
      const second = await h.category({ name: "Second", sortOrder: 2 });
      await expect(
        h.container.transaction(async () => {
          const selected = await repo().updateOne(
            { type: "food" },
            { $set: { name: "Changed" } },
            { sort: { sortOrder: -1 } },
          );
          expect(String(selected._id)).toBe(String(second._id));
          fail();
        }),
      ).rejects.toThrow("Injected failure");
      expect((await repo().findById(second._id)).name).toBe("Second");
    });
    it("does not delete an existing document after duplicate-ID create fails", async () => {
      const first = await h.category();
      await expect(
        h.container.transaction(() =>
          repo().create({ _id: first._id, name: "Duplicate", slug: "duplicate", type: "food" }),
        ),
      ).rejects.toMatchObject({ code: 11000 });
      expect((await repo().findById(first._id)).name).toBe("Carrot");
    });
    it("aborts the entire workflow even when a failed write is caught by its callback", async () => {
      const existing = await h.category();
      await expect(
        h.container.transaction(async () => {
          await repo().create({ name: "Partial", slug: "partial-caught", type: "food" });
          try {
            await repo().create({
              _id: existing._id,
              name: "Duplicate",
              slug: "duplicate",
              type: "food",
            });
          } catch {
            /* A caught duplicate write must not turn a failed transaction into a partial commit. */
          }
        }),
      ).rejects.toMatchObject({ code: 11000 });
      expect(await repo().count({ slug: "partial-caught" })).toBe(0);
    });
    it("serializes accepted increments and safely retries writers rejected by lock contention", async () => {
      const first = await h.category({ sortOrder: 0 });
      const other = h.worker().container;
      const increments = Array.from({ length: 6 }, (_, index) => {
        const worker = index % 2 ? other : h.container;
        return () =>
          worker.transaction(async () => {
            const row = await worker.repositories.categories.findById(first._id);
            await worker.repositories.categories.updateOne(
              { _id: first._id },
              { $set: { sortOrder: row.sortOrder + 1 } },
            );
          });
      });
      // Remote Redis latency can exhaust the bounded lock wait. Drain all callers
      // before inspecting persistence, and retry only failures rejected at acquire.
      const results = await Promise.allSettled(increments.map((increment) => increment()));
      const accepted = results.filter((result) => result.status === "fulfilled").length;
      expect(accepted).toBeGreaterThan(0);
      for (const result of results) {
        if (result.status === "rejected")
          expect(result.reason).toMatchObject({ code: "DATABASE_BUSY" });
      }
      expect((await repo().findById(first._id)).sortOrder).toBe(accepted);
      for (const [index, result] of results.entries()) {
        if (result.status === "rejected") await increments[index]();
      }
      expect((await repo().findById(first._id)).sortOrder).toBe(6);
      expect(await guard().findOne({ _id: "exclusive" })).toBeNull();
    });
    it("does not expose a partially written workflow to another coordinator", async () => {
      const first = await h.category();
      const changed = deferred(),
        finish = deferred();
      const other = h.worker().container;
      const writer = h.container.transaction(async () => {
        await repo().updateOne({ _id: first._id }, { $set: { name: "Intermediate" } });
        changed.resolve();
        await finish.promise;
        await repo().updateOne({ _id: first._id }, { $set: { name: "Final" } });
      });
      await changed.promise;
      let readFinished = false;
      const reader = other.repositories.categories.findById(first._id).then((row) => {
        readFinished = true;
        return row;
      });
      try {
        await delay(60);
        expect(readFinished).toBe(false);
      } finally {
        finish.resolve();
      }
      await writer;
      expect((await reader).name).toBe("Final");
    });
    it("waits for in-flight writes before rollback when a parallel workflow rejects", async () => {
      const entered = deferred(),
        release = deferred(),
        callbackFailed = deferred();
      const collection = h.container.models.categories.collection;
      const insert = collection.insertOne.bind(collection);
      vi.spyOn(collection, "insertOne").mockImplementationOnce(async (...args) => {
        entered.resolve();
        await release.promise;
        return insert(...args);
      });
      let pending;
      const transaction = h.container.transaction(async () => {
        pending = repo().create({ name: "Late", slug: "late", type: "food" });
        pending.catch(() => {});
        await entered.promise;
        callbackFailed.resolve();
        fail();
      });
      const outcome = transaction.catch((error) => error);
      try {
        await callbackFailed.promise;
        await delay(50);
      } finally {
        release.resolve();
      }
      await outcome;
      await pending;
      expect(await collection.countDocuments({ slug: "late" })).toBe(0);
      expect(await guard().countDocuments({})).toBe(0);
    });
    it("rejects a delayed child callback after its coordination scope has closed", async () => {
      const release = deferred();
      let late;
      await h.container.transaction(async () => {
        late = release.promise.then(() => repo().findOne({ slug: "orphan" }));
        late.catch(() => {});
      });
      release.resolve();
      await expect(late).rejects.toMatchObject({ code: "COORDINATION_CLOSED" });
      expect(await h.container.models.categories.countDocuments({ slug: "orphan" })).toBe(0);
    });
    it("rolls back on Redis lease loss without deleting another owner's lease", async () => {
      const first = await h.category();
      await expect(
        h.container.transaction(async () => {
          await repo().updateOne({ _id: first._id }, { $set: { name: "Changed" } });
          await h.client.set(`${h.prefix}:standalone-lock`, "new-owner", { PX: 1000 });
        }),
      ).rejects.toMatchObject({ code: "COORDINATION_LOST" });
      expect(await h.client.get(`${h.prefix}:standalone-lock`)).toBe("new-owner");
      expect((await h.container.models.categories.findById(first._id)).name).toBe("Carrot");
    });
    it("returns DATABASE_BUSY instead of running a second workflow when the lock wait expires", async () => {
      const support = createRedisSupport({ client: h.client, prefix: h.prefix, lockWaitMs: 60 });
      const held = await h.cache.acquire();
      try {
        await expect(support.acquire()).rejects.toMatchObject({ code: "DATABASE_BUSY" });
      } finally {
        await held.release();
      }
    });
    it("retains the Mongo guard through actual Redis lease expiration until the old worker rolls back", async () => {
      const row = await h.category();
      const changed = deferred(),
        finish = deferred();
      const old = h.container
        .transaction(async () => {
          await repo().updateOne({ _id: row._id }, { $set: { name: "Intermediate" } });
          changed.resolve();
          await finish.promise;
        })
        .catch((error) => error);
      await changed.promise;
      try {
        await h.client.pExpire(`${h.prefix}:standalone-lock`, 30);
        await delay(70);
        await expect(h.worker().container.repositories.categories.count({})).rejects.toMatchObject({
          code: "STANDALONE_RECOVERY_REQUIRED",
        });
      } finally {
        finish.resolve();
      }
      expect(await old).toMatchObject({ code: "COORDINATION_LOST" });
      expect((await repo().findById(row._id)).name).toBe("Carrot");
    });
    it("recovers a journal left by an actually terminated worker process", async () => {
      const row = await h.category();
      const child = fork(
        fileURLToPath(new URL("../../helpers/redis-crash-worker.js", import.meta.url)),
        [h.database, h.prefix, String(row._id)],
        {
          execPath: process.execPath,
          stdio: ["ignore", "ignore", "ignore", "ipc"],
          windowsHide: true,
        },
      );
      const closed = new Promise((resolve) => child.once("close", resolve));
      try {
        const message = await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Test worker did not reach its persisted write")),
            10000,
          );
          child.once("message", (value) => {
            clearTimeout(timer);
            resolve(value);
          });
          child.once("error", (error) => {
            clearTimeout(timer);
            reject(error);
          });
          child.once("exit", () => {
            clearTimeout(timer);
            reject(new Error("Test worker exited before acknowledgement"));
          });
        });
        expect(message).toBe("written");
      } finally {
        child.kill("SIGKILL");
        await closed;
      }
      await h.client.pExpire(`${h.prefix}:standalone-lock`, 1);
      await delay(20);
      await expect(repo().findById(row._id)).rejects.toMatchObject({
        code: "STANDALONE_RECOVERY_REQUIRED",
      });
      expect(await recoverStandaloneOperation(h.connection)).toBe(true);
      expect((await repo().findById(row._id)).name).toBe("Carrot");
    });
    it("keeps the durable guard after rollback fails and recovers once storage is available", async () => {
      const first = await h.category();
      const replace = vi
        .spyOn(mongoose.mongo.Collection.prototype, "replaceOne")
        .mockRejectedValueOnce(new Error("Injected rollback storage failure"));
      await expect(
        h.container.transaction(async () => {
          await repo().updateOne({ _id: first._id }, { $set: { name: "Changed" } });
          fail();
        }),
      ).rejects.toThrow("Injected rollback storage failure");
      expect(await guard().countDocuments({})).toBe(1);
      await expect(repo().count({})).rejects.toMatchObject({
        code: "STANDALONE_RECOVERY_REQUIRED",
      });
      replace.mockRestore();
      expect(await recoverStandaloneOperation(h.connection)).toBe(true);
      expect((await repo().findById(first._id)).name).toBe("Carrot");
      expect(await recoverStandaloneOperation(h.connection)).toBe(false);
    });
    it("does not steal a durable guard after the Redis key disappears and recovers interrupted creates", async () => {
      const id = new mongoose.Types.ObjectId();
      await guard().insertOne({
        _id: "exclusive",
        owner: "crashed-process",
        state: "running",
        entries: [{ collection: h.container.models.categories.collection.name, id, before: null }],
      });
      await h.container.models.categories.collection.insertOne({
        _id: id,
        name: "Partial",
        slug: "partial",
        type: "food",
      });
      await h.client.del(`${h.prefix}:standalone-lock`);
      await expect(repo().count({})).rejects.toMatchObject({
        code: "STANDALONE_RECOVERY_REQUIRED",
      });
      await recoverStandaloneOperation(h.connection);
      expect(await repo().count({})).toBe(0);
    });
    it("preserves committed writes when recovering an interrupted guard cleanup", async () => {
      const row = await h.category();
      await guard().insertOne({
        _id: "exclusive",
        owner: "committed-process",
        state: "committed",
        entries: [
          { collection: h.container.models.categories.collection.name, id: row._id, before: null },
        ],
      });
      await recoverStandaloneOperation(h.connection);
      expect(await repo().count({})).toBe(1);
    });
  },
);
