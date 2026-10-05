import { buildTestApp } from "../helpers/test-app.js";
import { startServer } from "../../src/server.js";

const fixture = buildTestApp();
const runtime = await startServer({
  env: {
    ...fixture.env,
    port: 0,
    scheduler: { ...fixture.env.scheduler, enabled: true, pollIntervalMs: 1000 },
  },
  logger: fixture.logger,
  overrides: {
    skipDatabaseConnect: true,
    repositories: fixture.repositories,
    authProvider: fixture.authProvider,
    storageProvider: fixture.storageProvider,
    aiProvider: fixture.aiProvider,
    messagingProvider: fixture.messagingProvider,
  },
});
process.on("message", async (message) => {
  if (message === "SIGTERM") {
    await runtime.stop("SIGTERM");
    process.send({
      stopped: true,
      listening: runtime.server.listening,
      schedulerStopped: (await runtime.scheduler.poll()).skipped === true,
    });
    process.disconnect();
  }
});
process.on("SIGTERM", async () => {
  await runtime.stop("SIGTERM");
  process.disconnect();
  process.exitCode = 0;
});
process.send({ port: runtime.server.address().port });
