export const MEDIA_CONTEXT = Object.freeze({
  AVATAR: "AVATAR",
  RECIPE: "RECIPE",
  POST: "POST",
  VIDEO: "VIDEO",
});

export const MEDIA_CONTEXTS = Object.freeze(Object.values(MEDIA_CONTEXT));

const MB = 1024 * 1024;

// Whitelist MIME type → phần mở rộng file và giới hạn dung lượng.
export const MIME_TYPES = Object.freeze({
  "image/jpeg": { extension: "jpg", maxBytes: 10 * MB },
  "image/png": { extension: "png", maxBytes: 10 * MB },
  "image/webp": { extension: "webp", maxBytes: 10 * MB },
  "video/mp4": { extension: "mp4", maxBytes: 200 * MB },
});

export const ALLOWED_MIME_TYPES = Object.freeze(Object.keys(MIME_TYPES));

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Ngữ cảnh upload nào nhận loại MIME nào.
export const CONTEXT_MIME_TYPES = Object.freeze({
  [MEDIA_CONTEXT.AVATAR]: IMAGE_TYPES,
  [MEDIA_CONTEXT.RECIPE]: IMAGE_TYPES,
  [MEDIA_CONTEXT.POST]: [...IMAGE_TYPES, "video/mp4"],
  [MEDIA_CONTEXT.VIDEO]: ["video/mp4"],
});

// Thư mục (namespace) trong bucket. Recipe/post chưa tồn tại lúc upload nên tạm gom theo userId;
// khi module recipes/content triển khai có thể chuyển sang recipes/{recipeId}/images/...
export const CONTEXT_KEY_PREFIX = Object.freeze({
  [MEDIA_CONTEXT.AVATAR]: (userId) => `users/${userId}/avatars`,
  [MEDIA_CONTEXT.RECIPE]: (userId) => `recipes/uploads/${userId}/images`,
  [MEDIA_CONTEXT.POST]: (userId) => `posts/uploads/${userId}/media`,
  [MEDIA_CONTEXT.VIDEO]: (userId) => `videos/${userId}`,
});
