import { randomUUID } from "node:crypto";
/** Single-instance polling scheduler. Database fencing mitigates accidental overlap;
 * production horizontal scaling still needs a queue/leader. FCM is at-least-once. */
export function createReminderScheduler({
  remindersService,
  env = {},
  logger,
  clock = () => new Date(),
  setIntervalImpl = setInterval,
  clearIntervalImpl = clearInterval,
  instanceId = randomUUID(),
} = {}) {
  const config = env.scheduler || env;
  let timer = null,
    inFlight = null,
    stopping = false;
  async function poll() {
    if (inFlight || stopping) return { processed: 0, failed: 0, skipped: true };
    inFlight = Promise.resolve().then(() =>
      remindersService.poll({
        instanceId,
        batchSize: config.batchSize || 20,
        lockTtlMs: config.lockTtlMs || 60000,
        now: new Date(clock()),
      }),
    );
    try {
      return await inFlight;
    } catch (error) {
      logger?.error?.({ code: error.code || "REMINDER_POLL_FAILED" }, "Reminder polling failed");
      return { processed: 0, failed: 1 };
    } finally {
      inFlight = null;
    }
  }
  return {
    instanceId,
    poll,
    start() {
      if (timer !== null || config.enabled !== true) return false;
      stopping = false;
      timer = setIntervalImpl(() => {
        void poll();
      }, config.pollIntervalMs || 30000);
      timer?.unref?.();
      return true;
    },
    async stop() {
      stopping = true;
      if (timer !== null) clearIntervalImpl(timer);
      timer = null;
      if (inFlight) await inFlight.catch(() => {});
    },
  };
}
