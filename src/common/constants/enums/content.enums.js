import { createEnum } from "./enum-factory.js";

export const CONTENT_STATUSES = createEnum({
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PROCESSING: "processing",
  PUBLISHED: "published",
  REJECTED: "rejected",
  HIDDEN: "hidden",
  DELETED: "deleted",
});

export const CONTENT_VISIBILITIES = createEnum({
  PUBLIC: "public",
  PRIVATE: "private",
  UNLISTED: "unlisted",
});

export const POST_VISIBILITIES = createEnum({
  PUBLIC: "public",
  PRIVATE: "private",
});

export const POST_TYPES = createEnum({
  COMMUNITY: "community",
  BLOG: "blog",
});

export const RECIPE_DIFFICULTIES = createEnum({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
});

export const CONTENT_SOURCE_TYPES = createEnum({
  ADMIN: "admin",
  COMMUNITY: "community",
  AI_ASSISTED: "ai_assisted",
});

export const CONTENT_SORTS = createEnum({
  NEWEST: "newest",
  OLDEST: "oldest",
  TITLE: "title",
  POPULAR: "popular",
  RATING: "rating",
  QUICKEST: "quickest",
});
