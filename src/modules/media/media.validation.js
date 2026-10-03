import { z } from "zod";
import { text, pagination } from "../../common/validators/domain.schemas.js";
import { idParams, empty } from "../recipes/content.validation.js";
export const mediaPurposes = [
  "avatar",
  "recipe",
  "recipe_step",
  "post",
  "video",
  "video_thumbnail",
  "ai_ingredient",
  "other",
];
export const createMediaValidation = () => ({
  createUploadRequest: {
    body: z
      .object({
        filename: text(255),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]),
        sizeBytes: z
          .number()
          .int()
          .positive()
          .max(1024 * 1024 * 1024),
        purpose: z.enum(mediaPurposes),
      })
      .strict()
      .refine(
        ({ mimeType, purpose }) =>
          !["avatar", "recipe_step", "video_thumbnail", "ai_ingredient"].includes(purpose) ||
          mimeType.startsWith("image/"),
        "Purpose requires an image",
      )
      .refine(
        ({ mimeType, purpose }) => purpose !== "video" || mimeType.startsWith("video/"),
        "Video purpose requires a video",
      ),
  },
  getMyMedia: {
    query: pagination
      .extend({
        status: z.enum(["pending", "ready", "rejected", "deleting", "deleted"]).optional(),
        purpose: z.enum(mediaPurposes).optional(),
      })
      .strict(),
  },
  confirmMediaUpload: { params: idParams, body: empty },
  getMediaAsset: { params: idParams },
  deleteMediaAsset: { params: idParams },
});
