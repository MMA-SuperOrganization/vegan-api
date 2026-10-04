import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { nextReminderRun } from "./reminder-schedule.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
export function createRemindersService({
  remindersRepository: repo,
  services = {},
  clock = () => new Date(),
  env = {},
  logger,
} = {}) {
  const now = () => new Date(clock());
  let polling = false;
  function next(schedule, after) {
    const value = nextReminderRun(schedule, after);
    if (!value)
      throw AppError.badRequest(
        "Reminder time must be in the future",
        [],
        "REMINDER_INVALID_SCHEDULE",
      );
    return value;
  }
  const versionFilter = (record) =>
    record.version == null
      ? { $or: [{ version: { $exists: false } }, { version: 0 }] }
      : { version: record.version };
  const unlocked = { lockedAt: null, lockedBy: null, lockExpiresAt: null, claimKey: null };
  const operations = {
    getReminders: ({ actor, query = {} }) =>
      repo.findMany(
        {
          userId: owner(actor),
          ...(query.status ? { status: query.status } : { status: { $ne: "cancelled" } }),
        },
        { page: query.page, limit: query.limit, sort: { nextRunAt: 1, _id: 1 } },
      ),
    createReminder: async ({ actor, body }) =>
      repo.create({
        ...body,
        userId: owner(actor),
        status: "active",
        nextRunAt: next(body.schedule, now()),
        version: 0,
        ...unlocked,
      }),
    async updateReminder({ actor, params, body }) {
      const userId = owner(actor);
      const current = await repo.findOne({ _id: params.id, userId, status: { $ne: "cancelled" } });
      if (!current) throw AppError.notFound("Reminder not found");
      const schedule = body.schedule || current.schedule;
      const status = body.status || current.status;
      const update = { ...body, ...unlocked };
      if (body.schedule || body.status === "active") update.nextRunAt = next(schedule, now());
      if (status === "paused") update.nextRunAt = current.nextRunAt;
      const result = await repo.updateOne(
        { _id: current._id, userId, ...versionFilter(current) },
        { $set: update, $inc: { version: 1 } },
      );
      if (!result) throw AppError.conflict("Reminder was changed concurrently");
      return result;
    },
    async deleteReminder({ actor, params }) {
      const result = await repo.updateOne(
        { _id: params.id, userId: owner(actor), status: { $ne: "cancelled" } },
        { $set: { status: "cancelled", ...unlocked }, $inc: { version: 1 } },
      );
      if (!result) throw AppError.notFound("Reminder not found");
      return { cancelled: true };
    },
  };
  async function poll({
    instanceId = randomUUID(),
    batchSize = env.scheduler?.batchSize || 20,
    lockTtlMs = env.scheduler?.lockTtlMs || 60000,
    now: dueAt,
  } = {}) {
    if (polling) return { processed: 0, failed: 0, skipped: true };
    polling = true;
    const attempted = [];
    let processed = 0,
      failed = 0;
    const cutoff = dueAt ? new Date(dueAt) : now();
    const batch = Math.min(1000, Math.max(1, batchSize));
    const ttl = Math.max(1, lockTtlMs);
    try {
      for (let i = 0; i < batch; i++) {
        const claimKey = randomUUID();
        const claimedAt = now();
        const reminder = await repo.updateOne(
          {
            status: "active",
            nextRunAt: { $lte: cutoff },
            ...(attempted.length ? { _id: { $nin: attempted } } : {}),
            $or: [{ lockExpiresAt: null }, { lockExpiresAt: { $lte: claimedAt } }],
          },
          {
            $set: {
              lockedAt: claimedAt,
              lockedBy: instanceId,
              claimKey,
              lockExpiresAt: new Date(claimedAt.getTime() + ttl),
            },
          },
          { sort: { nextRunAt: 1, _id: 1 } },
        );
        if (!reminder) break;
        attempted.push(reminder._id);
        const scheduledAt = new Date(reminder.nextRunAt);
        const filter = () => ({
          _id: reminder._id,
          userId: reminder.userId,
          status: "active",
          lockedBy: instanceId,
          claimKey,
          nextRunAt: scheduledAt,
          ...versionFilter(reminder),
          lockExpiresAt: { $gt: now() },
        });
        const assertClaim = async ({ minLeaseMs = 0 } = {}) => {
          if (
            !(await repo.updateOne(filter(), {
              $set: {
                lockExpiresAt: new Date(
                  now().getTime() + Math.max(ttl, Math.min(120000, minLeaseMs)),
                ),
              },
            }))
          )
            throw AppError.conflict("Reminder claim was lost", [], "REMINDER_CLAIM_LOST");
          return true;
        };
        try {
          await assertClaim();
          if (!services.notifications?.deliver)
            throw AppError.serviceUnavailable("Notification service is unavailable");
          await services.notifications.deliver({
            userId: reminder.userId,
            type: reminder.type,
            title: reminder.title,
            body: reminder.body,
            data: {
              reminderId: String(reminder._id),
              scheduledAt: scheduledAt.toISOString(),
              route: { meal: "meal-plans", water: "water-logs", custom: "reminders" }[
                reminder.type
              ],
            },
            deliveryKey: `${reminder._id}:${scheduledAt.toISOString()}`,
            assertClaim,
          });
          await assertClaim();
          // Skip missed recurrence slots rather than blasting catch-up notifications.
          const nextAt = nextReminderRun(
            reminder.schedule,
            new Date(Math.max(scheduledAt.getTime(), now().getTime())),
          );
          const updated = await repo.updateOne(filter(), {
            $set: {
              lastRunAt: scheduledAt,
              nextRunAt: nextAt,
              status: nextAt ? "active" : "completed",
              ...unlocked,
            },
            $unset: { failureCode: "" },
            $inc: { version: 1 },
          });
          if (!updated)
            throw AppError.conflict("Reminder claim was lost", [], "REMINDER_CLAIM_LOST");
          processed++;
        } catch (error) {
          failed++;
          // Fence by random claimKey: an expired worker can never release a new owner's lock.
          await repo.updateOne(
            { _id: reminder._id, lockedBy: instanceId, claimKey },
            {
              $set: {
                ...unlocked,
                failureCode:
                  error.code === "REMINDER_CLAIM_LOST"
                    ? "REMINDER_CLAIM_LOST"
                    : "REMINDER_DELIVERY_FAILED",
              },
            },
          );
          logger?.warn?.(
            { reminderId: String(reminder._id), code: error.code || "REMINDER_DELIVERY_FAILED" },
            "Reminder delivery failed",
          );
        }
      }
      return { processed, failed };
    } finally {
      polling = false;
    }
  }
  return { ...operations, poll };
}
