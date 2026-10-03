import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { preferencesSchema } from "./notifications.validation.js";
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
export function isQuietHours(preferences, now) {
  if (!preferences.quietHours?.enabled) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: preferences.timezone || "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const local = `${parts.find((p) => p.type === "hour").value}:${parts.find((p) => p.type === "minute").value}`;
  const { start, end } = preferences.quietHours;
  return (
    start === end || (start < end ? local >= start && local < end : local >= start || local < end)
  );
}
export function createNotificationsService({
  notificationsRepository: repos,
  services = {},
  env = {},
  messagingProvider,
  clock = () => new Date(),
  logger,
} = {}) {
  const now = () => new Date(clock());
  const visible = (userId) => ({ userId, deletedAt: null });
  const getPreferences = async (userId) => ({
    ...preferencesSchema.parse({}),
    ...((await repos.notificationPreferences.findOne({ userId })) || {}),
    userId,
  });
  const unreadCount = (userId) => repos.notifications.count({ ...visible(userId), readAt: null });
  const operations = {
    getNotifications: ({ actor, query = {} }) =>
      repos.notifications.findMany(
        {
          ...visible(owner(actor)),
          ...(query.unread === "true"
            ? { readAt: null }
            : query.unread === "false"
              ? { readAt: { $ne: null } }
              : {}),
        },
        { page: query.page, limit: query.limit, sort: { createdAt: -1, _id: -1 } },
      ),
    async getUnreadNotificationCount({ actor }) {
      return { count: await unreadCount(owner(actor)) };
    },
    async markNotificationAsRead({ actor, params }) {
      const userId = owner(actor);
      const filter = { ...visible(userId), _id: params.id };
      const value = await repos.notifications.updateOne(
        { ...filter, readAt: null },
        { $set: { readAt: now(), status: "read" } },
      );
      if (value) return value;
      const existing = await repos.notifications.findOne(filter);
      if (!existing) throw AppError.notFound("Notification not found");
      return existing;
    },
    async markAllNotificationsAsRead({ actor }) {
      const userId = owner(actor);
      const readAt = now();
      let count = 0;
      // Common repository deliberately exposes atomic updateOne, not unbounded updateMany.
      // A timestamp fence prevents concurrently arriving notifications extending this loop.
      while (
        await repos.notifications.updateOne(
          { ...visible(userId), readAt: null, createdAt: { $lte: readAt } },
          { $set: { readAt, status: "read" } },
        )
      )
        count++;
      return { count };
    },
    async deleteNotification({ actor, params }) {
      const value = await repos.notifications.updateOne(
        { _id: params.id, ...visible(owner(actor)) },
        { $set: { deletedAt: now() } },
      );
      if (!value) throw AppError.notFound("Notification not found");
      return { deleted: true };
    },
    getNotificationPreferences: ({ actor }) => getPreferences(owner(actor)),
    upsertNotificationPreferences: ({ actor, body }) =>
      repos.notificationPreferences.updateOne(
        { userId: owner(actor) },
        { $set: preferencesSchema.parse(body), $setOnInsert: { userId: actor.userId } },
        { upsert: true },
      ),
  };
  const deliveries = new Map();
  async function deliver(input) {
    const key = `${input.userId}:${input.deliveryKey || randomUUID()}`;
    if (deliveries.has(key)) return deliveries.get(key);
    const pending = dispatch(input);
    deliveries.set(key, pending);
    try {
      return await pending;
    } finally {
      if (deliveries.get(key) === pending) deliveries.delete(key);
    }
  }
  async function dispatch({
    userId,
    type,
    title,
    body,
    data = {},
    deliveryKey,
    assertClaim = async () => true,
  }) {
    await assertClaim();
    const key = deliveryKey || randomUUID();
    let notification;
    try {
      notification = await repos.notifications.updateOne(
        { deliveryKey: key },
        {
          $setOnInsert: {
            userId,
            type,
            title,
            body,
            data,
            deliveryKey: key,
            channel: "in_app",
            status: "sent",
            sentAt: now(),
            readAt: null,
            deletedAt: null,
            pushStatus: "pending",
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      notification = await repos.notifications.findOne({ deliveryKey: key });
    }
    if (!notification || String(notification.userId) !== String(userId))
      throw AppError.conflict("Notification delivery key conflict");
    if (["sent", "skipped"].includes(notification.pushStatus)) return notification;
    const lockId = randomUUID();
    const claimed = await repos.notifications.updateOne(
      {
        _id: notification._id,
        pushStatus: { $in: ["pending", "failed"] },
        $or: [{ pushLockExpiresAt: null }, { pushLockExpiresAt: { $lte: now() } }],
      },
      { $set: { pushLockedBy: lockId, pushLockExpiresAt: new Date(now().getTime() + 120000) } },
    );
    if (!claimed)
      throw AppError.serviceUnavailable(
        "Notification delivery is already being processed",
        "NOTIFICATION_DELIVERY_BUSY",
      );
    const pushLeaseMs = 120000;
    const pushTimeoutMs = Math.min(60000, Math.max(1, env.fcmTimeoutMs || 30000));
    const pushFilter = () => ({
      _id: notification._id,
      userId,
      pushLockedBy: lockId,
      pushLockExpiresAt: { $gt: now() },
    });
    const claimLost = () =>
      AppError.conflict("Notification push claim was lost", [], "NOTIFICATION_CLAIM_LOST");
    const renewPush = async () => {
      if (
        !(await repos.notifications.updateOne(pushFilter(), {
          $set: { pushLockExpiresAt: new Date(now().getTime() + pushLeaseMs) },
        }))
      )
        throw claimLost();
    };
    const finish = async (fields) => {
      const result = await repos.notifications.updateOne(pushFilter(), {
        $set: { ...fields, pushLockExpiresAt: null },
        $unset: { pushLockedBy: "" },
      });
      if (!result) throw claimLost();
      return result;
    };
    try {
      await assertClaim();
      const preferences = await getPreferences(userId);
      const typeEnabled =
        type === "meal"
          ? preferences.mealReminderEnabled
          : type === "water"
            ? preferences.waterReminderEnabled
            : ["content", "post", "recipe", "video"].includes(type)
              ? preferences.contentEnabled
              : true;
      if (
        env.fcmEnabled !== true ||
        messagingProvider?.enabled === false ||
        !preferences.pushEnabled ||
        !typeEnabled ||
        isQuietHours(preferences, now())
      )
        return await finish({ pushStatus: "skipped" });
      const user = services.users?.getFcmTokens ? null : await services.users?.getById?.(userId);
      const rawTokens = services.users?.getFcmTokens
        ? await services.users.getFcmTokens(userId)
        : user?.fcmTokens || [];
      const tokens = [
        ...new Set(
          rawTokens
            .map((entry) => (typeof entry === "string" ? entry : entry.token))
            .filter(Boolean),
        ),
      ];
      if (!tokens.length) return await finish({ pushStatus: "skipped" });
      if (!messagingProvider?.send)
        throw AppError.serviceUnavailable("Push provider is unavailable");
      await assertClaim();
      let sent = 0,
        failed = 0,
        invalidTokens = [];
      for (let i = 0; i < tokens.length; i += 500) {
        await assertClaim({ minLeaseMs: pushTimeoutMs + 5000 });
        await renewPush(); // Fence our own push lease immediately before external side effects.
        let timeout;
        let response;
        try {
          response = await Promise.race([
            messagingProvider.send({
              tokens: tokens.slice(i, i + 500),
              title,
              body,
              data: { ...data, notificationId: String(notification._id), deliveryKey: key },
            }),
            new Promise((_, reject) => {
              timeout = setTimeout(
                () => reject(AppError.serviceUnavailable("Push delivery timed out", "FCM_TIMEOUT")),
                pushTimeoutMs,
              );
            }),
          ]);
        } finally {
          clearTimeout(timeout);
        }
        await renewPush();
        sent += response.sent || 0;
        failed += response.failed || 0;
        invalidTokens.push(...(response.invalidTokens || []));
      }
      if (invalidTokens.length) await services.users?.removeFcmTokens?.(userId, invalidTokens);
      if (failed > invalidTokens.length)
        throw AppError.serviceUnavailable("Some push deliveries failed", "FCM_SEND_FAILED");
      await assertClaim();
      // FCM is at-least-once: a crash after provider acceptance but before this write
      // can resend. The client should deduplicate using deliveryKey/notificationId.
      return await finish({
        pushStatus: sent ? "sent" : failed ? "failed" : "skipped",
        ...(failed ? { failureReason: "FCM_PARTIAL_FAILURE" } : {}),
      });
    } catch (error) {
      if (error.code === "NOTIFICATION_CLAIM_LOST") throw error;
      await finish({ pushStatus: "failed", failureReason: "PUSH_DELIVERY_FAILED" });
      logger?.warn?.(
        { notificationId: String(notification._id), code: "PUSH_DELIVERY_FAILED" },
        "Push delivery failed; in-app notification retained",
      );
      if (error.code === "REMINDER_CLAIM_LOST") throw error;
      throw AppError.serviceUnavailable(
        "Push delivery is temporarily unavailable; in-app notification retained",
        "FCM_SEND_FAILED",
      );
    }
  }
  return { ...operations, getPreferences, unreadCount, deliver };
}
