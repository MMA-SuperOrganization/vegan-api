import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

const VALID_CONTEXTS = ["AVATAR", "POST", "RECIPE", "FOOD_ITEM", "COMMENT_ATTACHMENT", "CHAT_ATTACHMENT", "ID_DOCUMENT"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default

export const createMediaValidation = () => ({
  createUploadRequest: {
    body: z.object({
      context: z.enum(VALID_CONTEXTS, { message: "Invalid context" }),
      contentType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
        message: "Invalid content type",
      }),
      originalFileName: z.string().trim().max(255).optional(),
      fileSize: z.number().int().positive().max(MAX_FILE_SIZE, { message: "File too large" }),
    }).strict().refine((data) => {
      if (data.context === "AVATAR" && data.contentType === "video/mp4") return false;
      return true;
    }, {
      message: "MIME type not allowed for this context",
      path: ["contentType"],
    }),
  },
  getMyMedia: {},
  confirmMediaUpload: {},
  getMediaAsset: {},
  deleteMediaAsset: {},
});
