import crypto from "crypto";
import { AppError } from "../../common/errors/app-error.js";

export const createMediaService = ({ mediaRepository, storageProvider }) => ({
  async createUploadRequest(req) {
    if (!storageProvider) {
      throw AppError.serviceUnavailable("Storage is not configured");
    }

    const { context, contentType, fileSize } = req.validated.body;
    const ext = contentType.split("/")[1];
    
    // Map context to plural directory name
    const contextMap = {
      AVATAR: "avatars",
      POST: "posts",
      RECIPE: "recipes",
      FOOD_ITEM: "food_items",
      COMMENT_ATTACHMENT: "comment_attachments",
      CHAT_ATTACHMENT: "chat_attachments",
      ID_DOCUMENT: "id_documents"
    };
    const folder = contextMap[context] || "others";
    const objectKey = `users/${req.auth.userId}/${folder}/${crypto.randomUUID()}.${ext}`;

    const { url, expiresAt } = await storageProvider.createUploadUrl({
      key: objectKey,
      contentType,
      contentLength: fileSize,
      expiresIn: 300,
    });

    return {
      objectKey,
      method: "PUT",
      expiresIn: 300,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize)
      },
      uploadUrl: url,
      expiresAt
    };
  },
  async getMyMedia(req) {
    return await mediaRepository.findAll(req.query);
  },
  async confirmMediaUpload(req) {
    return await mediaRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getMediaAsset(req) {
    return await mediaRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async deleteMediaAsset(req) {
    return await mediaRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
