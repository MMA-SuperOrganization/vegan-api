import { createEnum } from "./enum-factory.js";

export const COMMENT_TARGET_TYPES = createEnum({
  POST: "post",
  VIDEO: "video",
});

export const COMMENT_STATUSES = createEnum({
  VISIBLE: "visible",
  HIDDEN: "hidden",
  DELETED: "deleted",
});

export const REACTION_TARGET_TYPES = createEnum({
  POST: "post",
  VIDEO: "video",
  COMMENT: "comment",
});

export const REACTION_TYPES = createEnum({
  LIKE: "like",
  LOVE: "love",
  HELPFUL: "helpful",
});

export const RATING_TARGET_TYPES = createEnum({
  RECIPE: "recipe",
  VIDEO: "video",
});

export const SAVED_TARGET_TYPES = createEnum({
  RECIPE: "recipe",
  FOOD_ITEM: "food-item",
  POST: "post",
  VIDEO: "video",
});

export const VIEW_HISTORY_TARGET_TYPES = createEnum({
  RECIPE: "recipe",
  POST: "post",
  VIDEO: "video",
});
