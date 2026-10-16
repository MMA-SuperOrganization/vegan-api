import { describe, expect, it, vi } from "vitest";
import { createRedisSupport } from "../../src/common/cache/redis.js";
import { cachedController } from "../../src/common/cache/operation-cache.js";
import { loadEnv } from "../../src/config/env.js";

const memoryClient = () => {
  const values = new Map();
  return {
    values,
    get: vi.fn(async (key) => values.get(key) ?? null),
    set: vi.fn(async (key, value) => {
      values.set(key, value);
      return "OK";
    }),
  };
};
describe("Redis cache boundaries", () => {
  it("caches identical catalog queries and invalidates across mutations", async () => {
    const client = memoryClient();
    const cache = createRedisSupport({ client, prefix: "isolated" });
    const load = vi.fn(async () => ({ data: [{ name: "Tofu" }], meta: { total: 1 } }));
    await cache.remember("food:q=tofu", load);
    await cache.remember("food:q=tofu", load);
    expect(load).toHaveBeenCalledTimes(1);
    await cache.remember("food:q=rice", load);
    await cache.invalidate();
    await cache.remember("food:q=tofu", load);
    expect(load).toHaveBeenCalledTimes(3);
    expect(client.set.mock.calls[0][2]).toEqual({ EX: 60 });
  });
  it("serves database reads when Redis fails but rejects coordination", async () => {
    const client = {
      get: async () => {
        throw Error("offline");
      },
      set: async () => {
        throw Error("offline");
      },
    };
    const cache = createRedisSupport({ client, prefix: "test" });
    expect(await cache.remember("x", async () => 42)).toBe(42);
    await expect(cache.acquire()).rejects.toMatchObject({ code: "REDIS_UNAVAILABLE" });
  });
  it("never uses shared cache for authenticated inactive-catalog requests", async () => {
    const remember = vi.fn();
    const operation = vi.fn(async () => ({ data: [{ status: "inactive" }], meta: {} }));
    const container = { cache: { remember }, operations: { getCategories: operation } };
    const controller = cachedController(container, { operationId: "getCategories" }, () => {});
    const res = {
      locals: { requestId: "current-request" },
      status() {
        return this;
      },
      json: vi.fn(),
    };
    await controller(
      { auth: { role: "admin" }, validated: { query: { status: "inactive" } }, ip: "localhost" },
      res,
      (err) => {
        throw err;
      },
    );
    expect(remember).not.toHaveBeenCalled();
    expect(operation).toHaveBeenCalledOnce();
    expect(res.json.mock.calls[0][0].meta.requestId).toBe("current-request");
  });
  it("does not cache health, user data, AI, or signed media", () => {
    const handler = () => {};
    for (const operationId of ["getMe", "getMedia", "sendAiMessage", "getVideo", "checkReadiness"])
      expect(cachedController({ cache: {} }, { operationId }, handler)).toBe(handler);
  });
  it("validates standalone configuration without exposing connection strings", () => {
    expect(() => loadEnv({ NODE_ENV: "test", MONGODB_STANDALONE_REDIS_ENABLED: "true" })).toThrow(
      "Redis is required",
    );
    expect(() => loadEnv({ NODE_ENV: "test", REDIS_URL: "https://invalid.example" })).toThrow(
      "Expected redis://",
    );
  });
});
