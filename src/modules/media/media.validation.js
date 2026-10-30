import { z } from "zod";
import { text, pagination } from "../../common/validators/domain.schemas.js";
import { idParams, empty } from "../../common/validators/content.schemas.js";
import {
  MEDIA_MIME_TYPES,
  MEDIA_PURPOSES,
  MEDIA_STATUSES,
} from "../../common/constants/enums/media.enums.js";

export const mediaPurposes = MEDIA_PURPOSES.values();
export const createMediaValidation = () => ({
  createUploadRequest: {
    body: z
      .object({
        filename: text(255),
        mimeType: z.enum(MEDIA_MIME_TYPES.values()),
        sizeBytes: z
          .number()
          .int()
          .positive()
          .max(1024 * 1024 * 1024),
        purpose: z.enum(MEDIA_PURPOSES.values()),
      })
      .strict()
      .refine(
        ({ mimeType, purpose }) =>
          ![
            MEDIA_PURPOSES.AVATAR,
            MEDIA_PURPOSES.RECIPE_STEP,
            MEDIA_PURPOSES.VIDEO_THUMBNAIL,
            MEDIA_PURPOSES.AI_INGREDIENT,
            MEDIA_PURPOSES.AI_CHAT,
          ].includes(purpose) || mimeType.startsWith("image/"),
        "Purpose requires an image",
      )
      .refine(
        ({ mimeType, purpose }) =>
          purpose !== MEDIA_PURPOSES.VIDEO || mimeType.startsWith("video/"),
        "Video purpose requires a video",
      ),
  },
  getMyMedia: {
    query: pagination
      .extend({
        status: z.enum(MEDIA_STATUSES.values()).optional(),
        purpose: z.enum(MEDIA_PURPOSES.values()).optional(),
      })
      .strict(),
  },
  confirmMediaUpload: { params: idParams, body: empty },
  getMediaAsset: { params: idParams },
  deleteMediaAsset: { params: idParams },
});
