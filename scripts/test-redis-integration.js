import { randomUUID } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

const execute = promisify(execFile);
const runId = randomUUID().slice(0, 8);
const label = `vegeta-redis-tests-${runId}`;
const containers = [];
const configuredRedis = process.argv.includes("--configured-redis");
const docker = async (...args) => {
  try {
    return (await execute("docker", args, { windowsHide: true })).stdout.trim();
  } catch {
    throw new Error("Docker integration infrastructure command failed");
  }
};
const start = async (kind, image, port, args = []) => {
  const name = `${label}-${kind}`;
  containers.push(name);
  await docker(
    "run",
    "--detach",
    "--name",
    name,
    "--label",
    `codex.task=${label}`,
    "--publish",
    `127.0.0.1::${port}`,
    image,
    ...args,
  );
  const info = JSON.parse(await docker("inspect", name))[0];
  return { name, port: info.NetworkSettings.Ports[`${port}/tcp`][0].HostPort };
};
let exitCode = 1;
try {
  if (configuredRedis && !process.env.REDIS_URL) throw new Error("Configured Redis URL is missing");
  const mongo = await start("standalone", "mongo:8.0", 27017, ["--bind_ip_all"]);
  const replica = await start("replica", "mongo:8.0", 27017, ["--replSet", "rs0", "--bind_ip_all"]);
  const redis = configuredRedis ? null : await start("redis", "redis:7.4.6-alpine3.21", 6379);
  for (const instance of [mongo, replica]) {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await docker(
          "exec",
          instance.name,
          "mongosh",
          "--quiet",
          "--eval",
          "db.adminCommand({ping:1})",
        );
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    if (!ready) throw new Error("Disposable MongoDB did not become ready");
  }
  await docker(
    "exec",
    replica.name,
    "mongosh",
    "--quiet",
    "--eval",
    'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})',
  );
  let elected = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = await docker(
      "exec",
      replica.name,
      "mongosh",
      "--quiet",
      "--eval",
      "db.hello().isWritablePrimary",
    );
    if (result === "true") {
      elected = true;
      break;
    }
    await delay(250);
  }
  if (!elected) throw new Error("Disposable replica set did not elect a primary");
  process.stdout.write(
    `Running real Redis integration tests (${configuredRedis ? "configured Redis, isolated keys" : "disposable Redis"}; isolated MongoDB databases).\n`,
  );
  exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["node_modules/vitest/vitest.mjs", "run", "tests/integration/redis", "--maxWorkers=1"],
      {
        stdio: "inherit",
        windowsHide: true,
        env: {
          ...process.env,
          NODE_ENV: "test",
          RUN_REDIS_INTEGRATION_TESTS: "true",
          REDIS_URL_TEST: configuredRedis
            ? process.env.REDIS_URL
            : `redis://127.0.0.1:${redis.port}/0`,
          REDIS_MONGODB_URI_TEST: `mongodb://127.0.0.1:${mongo.port}/?directConnection=true`,
          REDIS_REPLICA_URI_TEST: `mongodb://127.0.0.1:${replica.port}/?directConnection=true&replicaSet=rs0`,
        },
      },
    );
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
} catch (error) {
  process.stderr.write(
    `${error.message === "Configured Redis URL is missing" ? error.message : "Redis integration runner failed; check Docker and isolated test infrastructure."}\n`,
  );
} finally {
  for (const name of containers.reverse()) {
    try {
      const info = JSON.parse(await docker("inspect", name))[0];
      if (info.Config.Labels?.["codex.task"] !== label)
        throw new Error("Container ownership mismatch");
      await docker("rm", "--force", "--volumes", name);
    } catch {
      process.stderr.write(
        "Could not clean an owned test container; inspect Docker test resources.\n",
      );
      exitCode = 1;
    }
  }
}
process.exitCode = exitCode;
