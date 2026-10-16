import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { setTimeout as delay } from "node:timers/promises";
import { createRedisSupport, connectRedis } from "../../../src/common/cache/redis.js";
import {
  createRedisIntegrationHarness,
  deferred,
  redisIntegrationEnabled,
} from "../../helpers/redis-integration.js";

describe.skipIf(!redisIntegrationEnabled)(
  "real Redis + MongoDB HTTP cache",
  { timeout: 30000, hookTimeout: 30000 },
  () => {
    let h;
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

    it("hits the cache across HTTP requests while generating a fresh request ID", async () => {
      await h.category();
      const query = vi.spyOn(h.container.repositories.categories, "findMany");
      const first = await request(h.app)
        .get("/api/v1/categories")
        .set("X-Request-Id", "first")
        .expect(200);
      const second = await request(h.app)
        .get("/api/v1/categories")
        .set("X-Request-Id", "second")
        .expect(200);
      expect(second.body.data).toEqual(first.body.data);
      expect(second.body.meta.requestId).toBe("second");
      expect(query).toHaveBeenCalledOnce();
    });
    it("separates validated pagination and type filters", async () => {
      await h.category();
      await h.category({ name: "Soup", type: "recipe" });
      const foods = await request(h.app).get("/api/v1/categories?type=food&limit=1").expect(200);
      const recipes = await request(h.app)
        .get("/api/v1/categories?type=recipe&limit=1")
        .expect(200);
      const secondPage = await request(h.app)
        .get("/api/v1/categories?type=food&limit=1&page=2")
        .expect(200);
      expect(foods.body.data[0].type).toBe("food");
      expect(recipes.body.data[0].type).toBe("recipe");
      expect(secondPage.body.data).toEqual([]);
    });
    it("authenticates and validates before serving a warm cache", async () => {
      await h.category();
      await request(h.app).get("/api/v1/categories").expect(200);
      const query = vi.spyOn(h.container.repositories.categories, "findMany");
      await request(h.app)
        .get("/api/v1/categories")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
      await request(h.app).get("/api/v1/categories?limit=999999").expect(400);
      expect(query).not.toHaveBeenCalled();
    });
    it("does not share authenticated admin inactive records with guests", async () => {
      await h.category({ name: "Active" });
      await h.category({ name: "Hidden", status: "inactive" });
      const admin = await request(h.app)
        .get("/api/v1/categories?status=inactive")
        .set("Authorization", "Bearer redis-admin-token")
        .expect(200);
      const guest = await request(h.app).get("/api/v1/categories?status=inactive").expect(200);
      expect(admin.body.data.map((row) => row.name)).toEqual(["Hidden"]);
      expect(guest.body.data.map((row) => row.name)).toEqual(["Active"]);
    });
    it("invalidates a warm cache when an audited admin mutation commits", async () => {
      await request(h.app).get("/api/v1/categories").expect(200);
      await request(h.app)
        .post("/api/v1/categories")
        .set("Authorization", "Bearer redis-admin-token")
        .send({ name: "New category", type: "food" })
        .expect(201);
      const result = await request(h.app).get("/api/v1/categories").expect(200);
      expect(result.body.data.map((row) => row.name)).toEqual(["New category"]);
      expect(await h.container.models.auditLogs.countDocuments({ action: "category.create" })).toBe(
        1,
      );
    });
    it("invalidates cached lists after audited update and soft-delete", async () => {
      const row = await h.category();
      await request(h.app).get("/api/v1/categories").expect(200);
      await request(h.app)
        .patch(`/api/v1/categories/${row._id}`)
        .set("Authorization", "Bearer redis-admin-token")
        .send({ name: "Updated" })
        .expect(200);
      expect((await request(h.app).get("/api/v1/categories").expect(200)).body.data[0].name).toBe(
        "Updated",
      );
      await request(h.app)
        .delete(`/api/v1/categories/${row._id}`)
        .set("Authorization", "Bearer redis-admin-token")
        .send({})
        .expect(200);
      expect((await request(h.app).get("/api/v1/categories").expect(200)).body.data).toEqual([]);
    });
    it("blocks even warm HTTP cache reads when an unfinished durable guard exists", async () => {
      await request(h.app).get("/api/v1/categories").expect(200);
      await h.connection.db
        .collection("_standalone_operation")
        .insertOne({ _id: "exclusive", owner: "interrupted", state: "running", entries: [] });
      const response = await request(h.app).get("/api/v1/categories").expect(503);
      expect(response.body.error.code).toBe("STANDALONE_RECOVERY_REQUIRED");
    });
    it("rolls back the category if audit persistence fails and never caches the failed write", async () => {
      await request(h.app).get("/api/v1/categories").expect(200);
      vi.spyOn(h.container.repositories.auditLogs, "create").mockRejectedValueOnce(
        new Error("Injected audit failure"),
      );
      await request(h.app)
        .post("/api/v1/categories")
        .set("Authorization", "Bearer redis-admin-token")
        .send({ name: "Must roll back", type: "food" })
        .expect(500);
      const result = await request(h.app).get("/api/v1/categories").expect(200);
      expect(result.body.data).toEqual([]);
      expect(await h.container.models.categories.countDocuments({})).toBe(0);
    });
    it("never caches HTTP errors", async () => {
      await h.category();
      const query = vi
        .spyOn(h.container.repositories.categories, "findMany")
        .mockRejectedValueOnce(new Error("Injected read failure"));
      await request(h.app).get("/api/v1/categories").expect(500);
      await request(h.app).get("/api/v1/categories").expect(200);
      await request(h.app).get("/api/v1/categories").expect(200);
      expect(query).toHaveBeenCalledTimes(2);
    });
    it("expires entries using the actual Redis TTL", async () => {
      const cache = createRedisSupport({
        client: h.client,
        prefix: `${h.prefix}:ttl`,
        ttlSeconds: 1,
      });
      const load = vi.fn(async () => ({ version: 1 }));
      await cache.remember("catalog", load);
      await cache.remember("catalog", load);
      expect(load).toHaveBeenCalledOnce();
      await delay(1150);
      await cache.remember("catalog", load);
      expect(load).toHaveBeenCalledTimes(2);
    });
    it("does not publish an old in-flight read into the new cache generation", async () => {
      const started = deferred(),
        release = deferred();
      const old = h.cache.remember("race", async () => {
        started.resolve();
        await release.promise;
        return "old";
      });
      await started.promise;
      await h.cache.invalidate();
      expect(await h.cache.remember("race", async () => "new")).toBe("new");
      release.resolve();
      await old;
      expect(await h.cache.remember("race", async () => "unexpected reload")).toBe("new");
    });
    it("separates application namespaces on the same Redis database", async () => {
      const other = createRedisSupport({ client: h.client, prefix: `${h.prefix}:other` });
      await h.cache.remember("same-query", async () => "one");
      expect(await other.remember("same-query", async () => "two")).toBe("two");
    });
    it("recovers from corrupt cache JSON using MongoDB instead of returning a server error", async () => {
      await h.cache.remember("corrupt", async () => "original");
      for await (const keys of h.client.scanIterator({ MATCH: `${h.prefix}:cache:*`, COUNT: 100 }))
        if (keys.length) await h.client.set(keys[0], "not-json", { EX: 60 });
      expect(await h.cache.remember("corrupt", async () => "fresh")).toBe("fresh");
    });
    it("does not store oversized cache payloads", async () => {
      const load = vi.fn(async () => "x".repeat(512 * 1024 + 1));
      await h.cache.remember("oversized", load);
      await h.cache.remember("oversized", load);
      expect(load).toHaveBeenCalledTimes(2);
    });
    it("falls back to MongoDB on a disconnected cache client without standalone coordination", async () => {
      await h.category();
      const client = await connectRedis({
        config: { url: process.env.REDIS_URL_TEST },
        logger: { warn() {} },
      });
      client.destroy();
      const cache = createRedisSupport({ client, prefix: `${h.prefix}:disconnected` });
      const { app } = h.worker({ coordinated: false, support: cache });
      try {
        const result = await request(app).get("/api/v1/categories").expect(200);
        expect(result.body.data).toHaveLength(1);
      } finally {
        if (client.isOpen) client.destroy();
      }
    });
    it("fails closed on a disconnected coordination client even with a warm cache", async () => {
      const client = await connectRedis({
        config: { url: process.env.REDIS_URL_TEST },
        logger: { warn() {} },
      });
      const cache = createRedisSupport({ client, prefix: `${h.prefix}:disconnected` });
      const { app } = h.worker({ support: cache });
      try {
        await request(app).get("/api/v1/categories").expect(200);
        client.destroy();
        const result = await request(app).get("/api/v1/categories").expect(503);
        expect(result.body.error.code).toBe("REDIS_UNAVAILABLE");
      } finally {
        if (client.isOpen) client.destroy();
      }
    });
    it("reopens a closed client on later requests after the SDK retry budget has ended", async () => {
      const client = await connectRedis({
        config: { url: process.env.REDIS_URL_TEST },
        logger: { warn() {} },
      });
      const cache = createRedisSupport({ client, prefix: `${h.prefix}:retry` });
      try {
        client.destroy();
        expect(await cache.remember("catalog", async () => "fallback")).toBe("fallback");
        for (let attempt = 0; attempt < 100 && !client.isReady; attempt++) await delay(20);
        expect(client.isReady).toBe(true);
        expect(await client.ping()).toBe("PONG");
        expect(await cache.remember("catalog", async () => "recovered")).toBe("recovered");
        expect(await cache.remember("catalog", async () => "must be cached")).toBe("recovered");
      } finally {
        if (client.isOpen) client.destroy();
      }
    });
  },
);
