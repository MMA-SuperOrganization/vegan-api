import { describe, it, expect, vi } from "vitest";
import { createRemindersModule, nextReminderRun } from "../../src/modules/reminders/index.js";
import { createNotificationsModule } from "../../src/modules/notifications/index.js";
import { createReminderScheduler } from "../../src/scheduler/reminder.scheduler.js";
import { createFirebaseMessagingProvider } from "../../src/providers/firebase/firebase-messaging.provider.js";
import { fakeRepository, objectId } from "./ai-reminders-fakes.js";
const userId = objectId(),
  other = objectId(),
  actor = { userId };
function fixture() {
  let at = new Date("2026-10-03T12:00:00Z");
  const clock = () => at;
  const repositories = Object.fromEntries(
    ["notifications", "notificationPreferences", "reminders"].map((k) => [
      k,
      fakeRepository([], clock),
    ]),
  );
  const services = {
    users: {
      getFcmTokens: vi.fn(async () => ["valid", "invalid"]),
      removeFcmTokens: vi.fn(async () => {}),
    },
  };
  const messagingProvider = {
    enabled: true,
    send: vi.fn(async () => ({ sent: 1, failed: 1, invalidTokens: ["invalid"] })),
  };
  const env = {
    fcmEnabled: true,
    scheduler: { enabled: true, batchSize: 2, lockTtlMs: 1000, pollIntervalMs: 100 },
  };
  const deps = { repositories, services, messagingProvider, env, clock };
  const notifications = createNotificationsModule(deps);
  Object.assign(services, notifications.services);
  const reminders = createRemindersModule(deps);
  Object.assign(services, reminders.services);
  return {
    deps,
    repositories,
    services,
    messagingProvider,
    notifications,
    reminders,
    advance: (ms) => {
      at = new Date(at.getTime() + ms);
    },
    clock,
  };
}
const body = {
  type: "water",
  title: "Drink water",
  body: "Time for a glass.",
  schedule: { mode: "daily", at: "12:01", timezone: "UTC" },
};
describe("notifications inbox and delivery", () => {
  it("exact operations, preferences persist in distinct unique store", async () => {
    const f = fixture();
    expect(Object.keys(f.notifications.operations).sort()).toEqual(
      Object.keys(f.notifications.validation).sort(),
    );
    expect((await f.services.notifications.getPreferences(userId)).timezone).toBe("UTC");
    await f.notifications.operations.upsertNotificationPreferences({
      actor,
      body: { pushEnabled: false },
    });
    expect(f.repositories.notificationPreferences.records).toHaveLength(1);
    expect(f.repositories.notifications.records).toHaveLength(0);
  });
  it("always creates in-app with push off; deliveryKey is idempotent", async () => {
    const f = fixture();
    f.deps.env.fcmEnabled = false;
    const input = { userId, type: "water", title: "Water", body: "Drink", deliveryKey: "unique-1" };
    await Promise.all([
      f.services.notifications.deliver(input),
      f.services.notifications.deliver(input),
    ]);
    expect(f.repositories.notifications.records).toHaveLength(1);
    expect(f.messagingProvider.send).not.toHaveBeenCalled();
    expect(await f.services.notifications.unreadCount(userId)).toBe(1);
  });
  it("push cleans invalid tokens without logging credentials", async () => {
    const f = fixture();
    await f.services.notifications.deliver({
      userId,
      type: "water",
      title: "Water",
      body: "Drink",
      deliveryKey: "push-1",
    });
    expect(f.messagingProvider.send).toHaveBeenCalledTimes(1);
    expect(f.services.users.removeFcmTokens).toHaveBeenCalledWith(userId, ["invalid"]);
    expect(f.repositories.notifications.records[0]).toMatchObject({
      channel: "in_app",
      status: "sent",
      pushStatus: "sent",
    });
  });
  it("quiet hours cross midnight and category preferences suppress push, not inbox", async () => {
    const f = fixture();
    await f.notifications.operations.upsertNotificationPreferences({
      actor,
      body: {
        quietHours: { enabled: true, start: "19:00", end: "08:00" },
        timezone: "America/Los_Angeles",
      },
    });
    await f.services.notifications.deliver({
      userId,
      type: "water",
      title: "Water",
      body: "Drink",
      deliveryKey: "quiet-1",
    });
    expect(f.messagingProvider.send).not.toHaveBeenCalled();
    expect(f.repositories.notifications.records).toHaveLength(1);
    await f.notifications.operations.upsertNotificationPreferences({
      actor,
      body: { waterReminderEnabled: false },
    });
    await f.services.notifications.deliver({
      userId,
      type: "water",
      title: "Water",
      body: "Drink",
      deliveryKey: "category-1",
    });
    expect(f.messagingProvider.send).not.toHaveBeenCalled();
  });
  it("owner-scoped read/read-all/delete and unread count use existing inbox records", async () => {
    const f = fixture();
    const first = await f.services.notifications.deliver({
      userId,
      type: "custom",
      title: "Hi",
      body: "Body",
      deliveryKey: "inbox1",
    });
    await f.services.notifications.deliver({
      userId: other,
      type: "custom",
      title: "Other",
      body: "Body",
      deliveryKey: "inbox2",
    });
    await expect(
      f.notifications.operations.markNotificationAsRead({
        actor: { userId: other },
        params: { id: first._id },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await f.notifications.operations.markNotificationAsRead({ actor, params: { id: first._id } });
    const read = await f.notifications.operations.markNotificationAsRead({
      actor,
      params: { id: first._id },
    });
    expect(read.status).toBe("read");
    await f.services.notifications.deliver({
      userId,
      type: "custom",
      title: "New",
      body: "Body",
      deliveryKey: "inbox3",
    });
    expect(await f.notifications.operations.markAllNotificationsAsRead({ actor })).toEqual({
      count: 1,
    });
    expect(await f.services.notifications.unreadCount(other)).toBe(1);
    expect(await f.services.notifications.unreadCount(userId)).toBe(0);
    await f.notifications.operations.deleteNotification({ actor, params: { id: first._id } });
    expect((await f.notifications.operations.getNotifications({ actor })).data).toHaveLength(1);
  });
  it("FCM error preserves in-app, retry can send", async () => {
    const f = fixture();
    f.messagingProvider.send.mockRejectedValueOnce(Error("secret token"));
    const input = { userId, type: "custom", title: "Hi", body: "Body", deliveryKey: "retry" };
    await expect(f.services.notifications.deliver(input)).rejects.toMatchObject({
      code: "FCM_SEND_FAILED",
    });
    expect(f.repositories.notifications.records[0].pushStatus).toBe("failed");
    expect((await f.services.notifications.deliver(input)).pushStatus).toBe("sent");
    expect(f.repositories.notifications.records).toHaveLength(1);
  });
});
describe("push deadlines and lease fencing", () => {
  it("fails closed if token lookup loses push ownership before send", async () => {
    const f = fixture();
    f.services.users.getFcmTokens.mockImplementation(async () => {
      f.advance(121000);
      f.repositories.notifications.records[0].pushLockedBy = "replacement";
      f.repositories.notifications.records[0].pushLockExpiresAt = new Date(
        f.clock().getTime() + 120000,
      );
      return ["valid"];
    });
    await expect(
      f.services.notifications.deliver({
        userId,
        type: "custom",
        title: "x",
        body: "y",
        deliveryKey: "stale",
      }),
    ).rejects.toMatchObject({ code: "NOTIFICATION_CLAIM_LOST" });
    expect(f.messagingProvider.send).not.toHaveBeenCalled();
    expect(f.repositories.notifications.records[0].pushLockedBy).toBe("replacement");
  });
  it("stale completion cannot clear or finish replacement push lock", async () => {
    const f = fixture();
    f.messagingProvider.send.mockImplementation(async () => {
      f.repositories.notifications.records[0].pushLockedBy = "replacement";
      return { sent: 1, failed: 0, invalidTokens: [] };
    });
    await expect(
      f.services.notifications.deliver({
        userId,
        type: "custom",
        title: "x",
        body: "y",
        deliveryKey: "finish-stale",
      }),
    ).rejects.toMatchObject({ code: "NOTIFICATION_CLAIM_LOST" });
    expect(f.repositories.notifications.records[0].pushStatus).toBe("pending");
    expect(f.repositories.notifications.records[0].pushLockedBy).toBe("replacement");
  });
  it("bounds even an injected hung provider while preserving in-app delivery", async () => {
    const f = fixture();
    f.deps.env.fcmTimeoutMs = 5;
    f.messagingProvider.send.mockImplementation(() => new Promise(() => {}));
    await expect(
      f.services.notifications.deliver({
        userId,
        type: "custom",
        title: "x",
        body: "y",
        deliveryKey: "timeout",
      }),
    ).rejects.toMatchObject({ code: "FCM_SEND_FAILED" });
    expect(f.repositories.notifications.records[0]).toMatchObject({
      channel: "in_app",
      status: "sent",
      pushStatus: "failed",
    });
  });
  it("Firebase adapter itself has a bounded multicast deadline", async () => {
    const provider = createFirebaseMessagingProvider({
      env: { fcmEnabled: true, fcmTimeoutMs: 5 },
      messaging: { sendEachForMulticast: () => new Promise(() => {}) },
    });
    await expect(provider.send({ tokens: ["a"], title: "x", body: "y" })).rejects.toMatchObject({
      code: "FCM_TIMEOUT",
    });
  });
});
describe("reminders scheduling and fencing", () => {
  it("extends short reminder leases for bounded in-flight push sends", async () => {
    const f = fixture();
    await f.reminders.operations.createReminder({ actor, body });
    f.advance(61000);
    f.messagingProvider.send.mockImplementation(async () => {
      f.advance(10000);
      return { sent: 1, failed: 0, invalidTokens: [] };
    });
    expect(await f.services.reminders.poll({ instanceId: "short-lease", lockTtlMs: 1000 })).toEqual(
      { processed: 1, failed: 0 },
    );
    expect(f.repositories.notifications.records[0].pushStatus).toBe("sent");
  });
  it("updates and polls historic reminders with truly absent version fields", async () => {
    const f = fixture();
    const first = await f.reminders.operations.createReminder({ actor, body });
    delete f.repositories.reminders.records[0].version;
    expect(
      (
        await f.reminders.operations.updateReminder({
          actor,
          params: { id: first._id },
          body: { title: "Legacy edited" },
        })
      ).version,
    ).toBe(1);
    await f.reminders.operations.createReminder({ actor, body });
    delete f.repositories.reminders.records[1].version;
    f.advance(61000);
    expect(await f.services.reminders.poll({ instanceId: "legacy", batchSize: 2 })).toEqual({
      processed: 2,
      failed: 0,
    });
    expect(f.repositories.reminders.records[1].version).toBe(1);
  });
  it("UTC daily/weekly and DST gap/fold semantics", () => {
    expect(
      nextReminderRun(
        { mode: "daily", at: "13:00", timezone: "UTC" },
        "2026-10-03T12:00:00Z",
      ).toISOString(),
    ).toBe("2026-10-03T13:00:00.000Z");
    expect(
      nextReminderRun(
        { mode: "weekly", at: "09:00", timezone: "UTC", daysOfWeek: [1] },
        "2026-10-03T12:00:00Z",
      ).toISOString(),
    ).toBe("2026-10-05T09:00:00.000Z");
    expect(
      nextReminderRun(
        { mode: "daily", at: "02:30", timezone: "America/New_York" },
        "2026-03-08T05:00:00Z",
      ).toISOString(),
    ).toBe("2026-03-08T07:30:00.000Z");
    expect(
      nextReminderRun(
        { mode: "daily", at: "01:30", timezone: "America/New_York" },
        "2026-11-01T04:00:00Z",
      ).toISOString(),
    ).toBe("2026-11-01T05:30:00.000Z");
    expect(
      nextReminderRun(
        { mode: "daily", at: "01:30", timezone: "America/New_York" },
        "2026-11-01T05:31:00Z",
      ).toISOString(),
    ).toBe("2026-11-02T06:30:00.000Z");
  });
  it("CRUD strict schedules owner scope pause resume cancel", async () => {
    const f = fixture();
    expect(
      f.reminders.validation.createReminder.body.safeParse({
        ...body,
        schedule: { mode: "weekly", at: "12:00", daysOfWeek: [1, 1], timezone: "UTC" },
      }).success,
    ).toBe(false);
    const r = await f.reminders.operations.createReminder({ actor, body });
    await expect(
      f.reminders.operations.updateReminder({
        actor: { userId: other },
        params: { id: r._id },
        body: { status: "paused" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(
      (
        await f.reminders.operations.updateReminder({
          actor,
          params: { id: r._id },
          body: { status: "paused" },
        })
      ).status,
    ).toBe("paused");
    expect(
      (
        await f.reminders.operations.updateReminder({
          actor,
          params: { id: r._id },
          body: { status: "active" },
        })
      ).nextRunAt.toISOString(),
    ).toBe("2026-10-03T12:01:00.000Z");
    await f.reminders.operations.deleteReminder({ actor, params: { id: r._id } });
    expect((await f.reminders.operations.getReminders({ actor })).data).toHaveLength(0);
    await expect(
      f.reminders.operations.createReminder({
        actor,
        body: { ...body, schedule: { mode: "once", at: "2020-01-01T00:00:00Z", timezone: "UTC" } },
      }),
    ).rejects.toMatchObject({ code: "REMINDER_INVALID_SCHEDULE" });
  });
  it("bounded batch and restart produces one delivery per scheduled occurrence", async () => {
    const f = fixture();
    for (let i = 0; i < 3; i++) await f.reminders.operations.createReminder({ actor, body });
    f.advance(61000);
    expect(
      await f.services.reminders.poll({ instanceId: "worker", batchSize: 2, lockTtlMs: 1000 }),
    ).toEqual({ processed: 2, failed: 0 });
    expect(f.repositories.notifications.records).toHaveLength(2);
    expect(await f.services.reminders.poll({ instanceId: "restarted", batchSize: 2 })).toEqual({
      processed: 1,
      failed: 0,
    });
    expect(f.repositories.notifications.records).toHaveLength(3);
    await f.services.reminders.poll({ instanceId: "restarted" });
    expect(f.repositories.notifications.records).toHaveLength(3);
  });
  it("once completes, failed reminder does not block next batch item", async () => {
    const f = fixture();
    await f.reminders.operations.createReminder({
      actor,
      body: { ...body, schedule: { mode: "once", at: "2026-10-03T12:01:00Z", timezone: "UTC" } },
    });
    await f.reminders.operations.createReminder({ actor, body });
    f.advance(61000);
    const deliver = f.services.notifications.deliver;
    f.services.notifications.deliver = vi
      .fn()
      .mockRejectedValueOnce(Error("bad"))
      .mockImplementation(deliver);
    expect(await f.services.reminders.poll({ instanceId: "one", batchSize: 2 })).toEqual({
      processed: 1,
      failed: 1,
    });
    expect(await f.services.reminders.poll({ instanceId: "two", batchSize: 2 })).toEqual({
      processed: 1,
      failed: 0,
    });
    expect(f.repositories.reminders.records[0].status).toBe("completed");
  });
  it("expired claims recover and random claimKey prevents stale owner completion", async () => {
    const f = fixture();
    const r = await f.reminders.operations.createReminder({ actor, body });
    f.advance(61000);
    f.repositories.reminders.records[0].lockedBy = "dead";
    f.repositories.reminders.records[0].claimKey = "dead-key";
    f.repositories.reminders.records[0].lockExpiresAt = new Date("2020-01-01");
    const original = f.services.notifications.deliver;
    f.services.notifications.deliver = async (input) => {
      f.repositories.reminders.records[0].claimKey = "new-owner";
      f.repositories.reminders.records[0].lockedBy = "replacement";
      await input.assertClaim();
      return original(input);
    };
    expect(await f.services.reminders.poll({ instanceId: "recovered" })).toEqual({
      processed: 0,
      failed: 1,
    });
    expect(f.repositories.reminders.records[0]).toMatchObject({
      _id: r._id,
      lockedBy: "replacement",
      claimKey: "new-owner",
      status: "active",
    });
    expect(f.repositories.notifications.records).toHaveLength(0);
  });
  it("parallel workers atomically claim one occurrence and failed completion recovers without duplicate inbox", async () => {
    const f = fixture();
    await f.reminders.operations.createReminder({ actor, body });
    f.advance(61000);
    const second = createRemindersModule(f.deps).services.reminders;
    const [a, b] = await Promise.all([
      f.services.reminders.poll({ instanceId: "a" }),
      second.poll({ instanceId: "b" }),
    ]);
    expect(a.processed + b.processed).toBe(1);
    expect(f.repositories.notifications.records).toHaveLength(1);
    f.advance(86400000);
    const original = f.services.notifications.deliver;
    let crash = true;
    f.services.notifications.deliver = async (input) => {
      const result = await original(input);
      if (crash) {
        crash = false;
        throw Error("crash after send");
      }
      return result;
    };
    expect((await f.services.reminders.poll({ instanceId: "a" })).failed).toBe(1);
    expect((await f.services.reminders.poll({ instanceId: "b" })).processed).toBe(1);
    expect(f.repositories.notifications.records).toHaveLength(2);
    expect(f.messagingProvider.send).toHaveBeenCalledTimes(2);
  });
  it("same service poll and scheduler guard overlap; stop waits for in-flight", async () => {
    let release;
    const work = new Promise((r) => {
      release = r;
    });
    const service = {
      poll: vi.fn(async () => {
        await work;
        return { processed: 1, failed: 0 };
      }),
    };
    const setIntervalImpl = vi.fn(() => ({ unref: vi.fn() })),
      clearIntervalImpl = vi.fn();
    const scheduler = createReminderScheduler({
      remindersService: service,
      env: { scheduler: { enabled: true } },
      setIntervalImpl,
      clearIntervalImpl,
    });
    expect(scheduler.start()).toBe(true);
    expect(scheduler.start()).toBe(false);
    const first = scheduler.poll();
    await Promise.resolve();
    expect(await scheduler.poll()).toMatchObject({ skipped: true });
    const stop = scheduler.stop();
    release();
    await first;
    await stop;
    expect(clearIntervalImpl).toHaveBeenCalledTimes(1);
    expect(service.poll).toHaveBeenCalledTimes(1);
  });
});
describe("Firebase messaging offline adapter", () => {
  it("disabled no provider invocation, enabled maps invalid tokens", async () => {
    const messaging = {
      sendEachForMulticast: vi.fn(async () => ({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: { code: "messaging/registration-token-not-registered" } },
        ],
      })),
    };
    const disabled = createFirebaseMessagingProvider({ env: { fcmEnabled: false }, messaging });
    await disabled.send({ tokens: ["a"], title: "x", body: "y" });
    expect(messaging.sendEachForMulticast).not.toHaveBeenCalled();
    const enabled = createFirebaseMessagingProvider({ env: { fcmEnabled: true }, messaging });
    expect(
      await enabled.send({ tokens: ["a", "b"], title: "x", body: "y", data: { count: 2 } }),
    ).toMatchObject({ sent: 1, invalidTokens: ["b"] });
    expect(messaging.sendEachForMulticast.mock.calls[0][0].data.count).toBe("2");
  });
});
