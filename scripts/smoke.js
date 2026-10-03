import assert from "node:assert/strict";
import { buildTestApp } from "../tests/helpers/test-app.js";
import { startServer } from "../src/server.js";

// Native Node import/listen smoke; every external dependency is injected.
const fixture = buildTestApp({ envOverrides: { SWAGGER_ENABLED: "true" } });
const runtime = await startServer({
  env: { ...fixture.env, port: 0 },
  logger: fixture.logger,
  overrides: { ...fixture.container, skipDatabaseConnect: true },
});
try {
  const base = `http://127.0.0.1:${runtime.server.address().port}`;
  for (const path of [
    "/api/v1/health",
    "/api/v1/health/ready",
    "/api-docs.json",
    "/api-docs/openapi.yaml",
    "/api-docs/",
  ]) {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(res.status, 200, path);
    await res.arrayBuffer();
  }
  const auth = await fetch(`${base}/api/v1/users/me`, { signal: AbortSignal.timeout(5000) });
  assert.equal(auth.status, 401);
  const body = await auth.json();
  assert.equal(body.error.code, "TOKEN_MISSING");
  assert.equal(Object.keys(runtime.container.operations).length, 184);
  process.stdout.write(
    `Native import/listen/health/readiness/Swagger/auth smoke PASS on ${process.version}; all integrations mocked.\n`,
  );
  if (Number(process.versions.node.split(".")[0]) < 24)
    process.stdout.write(
      "SKIP supported-runtime verification: Node 24+ is required but unavailable on this host.\n",
    );
  process.stdout.write(
    "SKIP Atlas/Firebase/R2/FCM/AI round trips: no real credentials or external-operation authorization.\n",
  );
} finally {
  await runtime.stop("smoke");
  assert.equal(runtime.server.listening, false);
  process.stdout.write("Graceful shutdown PASS.\n");
}
