import net from "node:net";
import tls from "node:tls";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setTimeout as delay } from "node:timers/promises";
import { connectRedis, createRedisSupport } from "../../../src/common/cache/redis.js";
import { redisIntegrationEnabled } from "../../helpers/redis-integration.js";

// A dedicated TCP proxy drops traffic only for this test's own client. Never
// stop/reconfigure a shared Redis instance to inject a failure.
describe.skipIf(!redisIntegrationEnabled)(
  "Redis half-open network deadlines",
  { timeout: 10000 },
  () => {
    let proxy,
      client,
      support,
      proxyUrl,
      dropping = false;
    const sockets = new Set();
    beforeAll(async () => {
      const target = new URL(process.env.REDIS_URL_TEST);
      proxy = net.createServer((incoming) => {
        const options = { host: target.hostname, port: Number(target.port || 6379) };
        const upstream =
          target.protocol === "rediss:"
            ? tls.connect({ ...options, servername: target.hostname })
            : net.connect(options);
        for (const socket of [incoming, upstream]) {
          sockets.add(socket);
          socket.on("error", () => {});
          socket.on("close", () => {
            sockets.delete(socket);
            incoming.destroy();
            upstream.destroy();
          });
        }
        incoming.on("data", (bytes) => {
          if (!dropping) upstream.write(bytes);
        });
        upstream.on("data", (bytes) => {
          if (!dropping) incoming.write(bytes);
        });
      });
      await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
      const url = new URL(target);
      url.protocol = "redis:";
      url.hostname = "127.0.0.1";
      url.port = String(proxy.address().port);
      proxyUrl = url.href;
    });
    beforeEach(async () => {
      dropping = false;
      client = await connectRedis({
        config: { url: proxyUrl, commandTimeoutMs: 150 },
        logger: { warn() {} },
      });
      support = createRedisSupport({
        client,
        prefix: `vegeta-integration:network-${proxy.address().port}`,
        commandTimeoutMs: 150,
      });
      dropping = true;
    }, 15000);
    afterEach(() => {
      if (client?.isOpen) client.destroy();
      for (const socket of sockets) socket.destroy();
    });
    afterAll(async () => {
      if (client?.isOpen) client.destroy();
      for (const socket of sockets) socket.destroy();
      if (proxy) await new Promise((resolve) => proxy.close(resolve));
    });
    const bounded = async (work) => {
      let timer;
      try {
        return await Promise.race([
          work(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("Redis command hung beyond integration deadline")),
              1500,
            );
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    };
    it("serves the fallback when TCP is connected but Redis never replies", async () => {
      expect(await bounded(() => support.remember("catalog", async () => "database result"))).toBe(
        "database result",
      );
    });
    it("rejects coordination promptly when a connected socket stops replying", async () => {
      await expect(bounded(() => support.acquire())).rejects.toMatchObject({
        code: "REDIS_UNAVAILABLE",
      });
    });
    it("reconnects after a response timeout when traffic is restored", async () => {
      expect(await bounded(() => support.remember("before", async () => "fallback"))).toBe(
        "fallback",
      );
      dropping = false;
      for (let attempt = 0; attempt < 50 && !client.isReady; attempt++) await delay(20);
      expect(client.isReady).toBe(true);
      expect(await client.ping()).toBe("PONG");
    });
    it("bounds startup when Redis accepts TCP but never completes the handshake", async () => {
      const start = performance.now();
      await expect(
        connectRedis({ config: { url: proxyUrl }, logger: { warn() {} } }),
      ).rejects.toMatchObject({ code: "REDIS_UNAVAILABLE" });
      expect(performance.now() - start).toBeLessThan(7500);
    });
  },
);
