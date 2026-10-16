import { createEnum } from "./enum-factory.js";

export const MEAL_TYPES = createEnum({
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "snack",
});

export const DIARY_SOURCE_TYPES = createEnum({
  RECIPE: "recipe",
  FOOD: "food",
  CUSTOM: "custom",
});

export const MEAL_PLAN_STATUSES = createEnum({
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

export const GROCERY_LIST_STATUSES = createEnum({
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

export const ACTIVITY_LEVELS = createEnum({
  SEDENTARY: "sedentary",
  LIGHT: "light",
  MODERATE: "moderate",
  ACTIVE: "active",
  VERY_ACTIVE: "very_active",
});

export const NUTRITION_GOALS = createEnum({
  LOSE_WEIGHT: "lose_weight",
  MAINTAIN: "maintain",
  GAIN_WEIGHT: "gain_weight",
  IMPROVE_NUTRITION: "improve_nutrition",
});

export const TDEE_SOURCES = createEnum({
  USER: "user",
  ESTIMATED: "estimated",
  INSUFFICIENT_DATA: "insufficient_data",
});
