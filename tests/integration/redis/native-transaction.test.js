import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createRedisIntegrationHarness,
  deferred,
  redisIntegrationEnabled,
} from "../../helpers/redis-integration.js";

describe.skipIf(!redisIntegrationEnabled)(
  "real Redis cache with native replica-set transactions",
  { timeout: 30000, hookTimeout: 30000 },
  () => {
    let h;
    beforeAll(async () => {
      h = await createRedisIntegrationHarness({ replicaSet: true });
    });
    afterEach(async () => {
      await h?.reset();
    });
    afterAll(async () => {
      await h?.close();
    });
    it("invalidates again after commit when a reader cached old data during the transaction", async () => {
      const first = await h.category();
      const repo = h.container.repositories.categories;
      const load = async () => (await repo.findById(first._id)).name;
      const changed = deferred(),
        finish = deferred();
      const transaction = h.container.transaction(async (session) => {
        await repo.updateOne({ _id: first._id }, { $set: { name: "Committed" } }, { session });
        changed.resolve();
        await finish.promise;
      });
      await changed.promise;
      try {
        expect(await h.cache.remember("name", load)).toBe("Carrot");
      } finally {
        finish.resolve();
      }
      await transaction;
      expect(await h.cache.remember("name", load)).toBe("Committed");
    });
    it("keeps original data and safe cached results when native transaction aborts", async () => {
      const first = await h.category();
      const repo = h.container.repositories.categories;
      await expect(
        h.container.transaction(async (session) => {
          await repo.updateOne({ _id: first._id }, { $set: { name: "Uncommitted" } }, { session });
          throw new Error("Abort native transaction");
        }),
      ).rejects.toThrow("Abort native transaction");
      expect(
        await h.cache.remember("name", async () => (await repo.findById(first._id)).name),
      ).toBe("Carrot");
      expect(await h.connection.db.collection("_standalone_operation").countDocuments({})).toBe(0);
    });
  },
);
