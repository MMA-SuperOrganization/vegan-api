import { createEnum } from "./enum-factory.js";

export const SEARCH_SCOPE_TYPES = createEnum({
  ALL: "all",
  RECIPE: "recipe",
  POST: "post",
  VIDEO: "video",
  FOOD_ITEM: "food-item",
});

export const AI_AUDIT_TASK_TYPES = createEnum({
  CHAT: "chat",
  MEAL_PLAN: "meal_plan",
  INGREDIENT_RECOGNITION: "ingredient_recognition",
  VIDEO_SUMMARY: "video_summary",
});

export const AI_AUDIT_STATUSES = createEnum({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  BLOCKED: "blocked",
});

export const AI_FEEDBACK_RATINGS = createEnum({
  HELPFUL: "helpful",
  NOT_HELPFUL: "not_helpful",
});
