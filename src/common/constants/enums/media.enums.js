import { createEnum } from "./enum-factory.js";

export const MEDIA_ENTITY_TYPES = createEnum({
  RECIPE: "recipe",
  POST: "post",
  VIDEO: "video",
  USER: "user",
});

export const MEDIA_KINDS = createEnum({
  IMAGE: "image",
  VIDEO: "video",
});

export const MEDIA_MIME_TYPES = createEnum({
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_WEBP: "image/webp",
  VIDEO_MP4: "video/mp4",
  VIDEO_WEBM: "video/webm",
});

export const MEDIA_PURPOSES = createEnum({
  AVATAR: "avatar",
  RECIPE: "recipe",
  RECIPE_STEP: "recipe_step",
  POST: "post",
  VIDEO: "video",
  VIDEO_THUMBNAIL: "video_thumbnail",
  AI_INGREDIENT: "ai_ingredient",
  OTHER: "other",
});

export const MEDIA_STATUSES = createEnum({
  PENDING: "pending",
  READY: "ready",
  REJECTED: "rejected",
  DELETING: "deleting",
  DELETED: "deleted",
});
