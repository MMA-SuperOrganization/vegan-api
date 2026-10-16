import { createClient } from "redis";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { AppError } from "../errors/app-error.js";
import { connectWithDeadline, createRedisCommandRunner } from "./redis-deadline.js";

const RELEASE =
  "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
export const connectRedis = async ({ config, logger }) => {
  if (!config?.url) return null;
  const client = createClient({
    url: config.url,
    disableOfflineQueue: true,
    commandOptions: { timeout: config.commandTimeoutMs ?? 1000 },
    commandsQueueMaxLength: 1000,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (attempt) =>
        attempt >= 3 ? new Error("Redis connection failed") : Math.min(100 * 2 ** attempt, 1000),
    },
  });
  // Provider errors may contain credentials. Only log the fixed event name.
  client.on("error", () => logger.warn("Redis connection unavailable"));
  try {
    await connectWithDeadline(client);
  } catch {
    if (client.isOpen) client.destroy();
    throw AppError.serviceUnavailable("Redis connection failed", "REDIS_UNAVAILABLE");
  }
  return client;
};

export const createRedisSupport = ({
  client,
  prefix,
  ttlSeconds = 60,
  lockWaitMs = 3000,
  lockTtlMs = 30000,
  commandTimeoutMs = 1000,
}) => {
  const key = (suffix) => `${prefix}:${suffix}`;
  const command = createRedisCommandRunner({ client, timeoutMs: commandTimeoutMs });
  const unavailable = () =>
    AppError.serviceUnavailable("Redis coordination unavailable", "REDIS_UNAVAILABLE");
  return {
    async invalidate() {
      try {
        await command("set", key("cache-version"), randomUUID(), { EX: ttlSeconds * 2 });
      } catch {
        /* Cache is optional; entries expire. */
      }
    },
    async remember(identity, load) {
      let cacheKey;
      try {
        const version = (await command("get", key("cache-version"))) ?? "initial";
        cacheKey = key(`cache:${version}:${createHash("sha256").update(identity).digest("hex")}`);
        const value = await command("get", cacheKey);
        if (value !== null) return JSON.parse(value);
      } catch {
        return load();
      }
      const result = await load();
      try {
        const serialized = JSON.stringify(result);
        if (Buffer.byteLength(serialized) <= 512 * 1024)
          await command("set", cacheKey, serialized, { EX: ttlSeconds });
      } catch {
        /* Read-through continues when Redis is down. */
      }
      return result;
    },
    async acquire() {
      const token = randomUUID(),
        lockKey = key("standalone-lock");
      const deadline = Date.now() + lockWaitMs;
      do {
        let acquired;
        try {
          acquired = await command("set", lockKey, token, { NX: true, PX: lockTtlMs });
        } catch {
          throw unavailable();
        }
        if (acquired)
          return {
            token,
            async assertOwned() {
              try {
                if ((await command("get", lockKey)) === token) return;
              } catch {
                throw unavailable();
              }
              throw AppError.serviceUnavailable(
                "Coordination lease expired; operation rolled back",
                "COORDINATION_LOST",
              );
            },
            async release() {
              try {
                await command("eval", RELEASE, { keys: [lockKey], arguments: [token] });
              } catch {
                /* Durable Mongo guard remains authoritative. */
              }
            },
          };
        await delay(25);
      } while (Date.now() < deadline);
      throw AppError.serviceUnavailable(
        "Another database operation is in progress; retry shortly",
        "DATABASE_BUSY",
      );
    },
  };
};
