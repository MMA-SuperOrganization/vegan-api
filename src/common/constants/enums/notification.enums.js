import { createEnum } from "./enum-factory.js";

export const REMINDER_TYPES = createEnum({
  MEAL: "meal",
  WATER: "water",
  CUSTOM: "custom",
});

export const REMINDER_FREQUENCIES = createEnum({
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
});

export const REMINDER_STATUSES = createEnum({
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const NOTIFICATION_CHANNELS = createEnum({
  IN_APP: "in_app",
  PUSH: "push",
});

export const NOTIFICATION_STATUSES = createEnum({
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  READ: "read",
});

export const DISPATCH_STATUSES = createEnum({
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  SKIPPED: "skipped",
});
