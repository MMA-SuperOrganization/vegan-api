import { createEnum } from "./enum-factory.js";

export const REPORT_TARGET_TYPES = createEnum({
  RECIPE: "recipe",
  POST: "post",
  VIDEO: "video",
  COMMENT: "comment",
  USER: "user",
});

export const REPORT_REASONS = createEnum({
  SPAM: "spam",
  HARMFUL: "harmful",
  MISINFORMATION: "misinformation",
  HARASSMENT: "harassment",
  COPYRIGHT: "copyright",
  OTHER: "other",
});

export const REPORT_STATUSES = createEnum({
  OPEN: "open",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
});

export const MODERATION_PRIORITIES = createEnum({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

export const MODERATION_ACTION_TYPES = createEnum({
  HIDE: "hide",
  RESTORE: "restore",
});
