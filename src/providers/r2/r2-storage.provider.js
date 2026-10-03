import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ERROR_CODES } from "../../common/constants/error-codes.js";
import { AppError } from "../../common/errors/app-error.js";

const toStorageError = (error, action) =>
  new AppError({
    statusCode: 503,
    code: ERROR_CODES.STORAGE_PROVIDER_ERROR,
    message: `Storage provider failed to ${action}`,
    isOperational: false,
    cause: error,
  });

/**
 * Adapter cho Cloudflare R2 (S3-compatible). Contract mà media service sử dụng:
 *   createUploadUrl({ key, contentType, contentLength, expiresIn }) → { url, expiresAt }
 *   createDownloadUrl({ key, expiresIn })            → { url, expiresAt }
 *   getObjectMetadata(key)                           → { contentType, contentLength, etag } | null
 *   deleteObject(key)                                → void
 *   getPublicUrl(key)                                → string | null
 *
 * Có thể thay bằng provider khác (S3, GCS...) miễn tuân theo cùng contract.
 *
 * @param {{
 *   s3Client: import("@aws-sdk/client-s3").S3Client,
 *   bucketName: string,
 *   publicBaseUrl?: string,
 *   defaultExpiresIn: number,
 *   signUrl?: typeof getSignedUrl,
 *   now?: () => number,
 * }} deps
 */
export const createR2StorageProvider = ({
  s3Client,
  bucketName,
  publicBaseUrl,
  defaultExpiresIn,
  signUrl = getSignedUrl,
  now = Date.now,
}) => {
  const expiresAtFrom = (expiresIn) => new Date(now() + expiresIn * 1000);

  return {
    destroy() {
      s3Client.destroy?.();
    },
    async createUploadUrl({ key, contentType, contentLength, expiresIn = defaultExpiresIn }) {
      // ContentType/ContentLength được ký vào URL: client phải PUT đúng header,
      // nếu không R2 trả SignatureDoesNotMatch. Nhờ vậy giới hạn được loại và dung lượng file.
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        ...(contentLength && { ContentLength: contentLength }),
      });
      try {
        // Mặc định presigner không ký Content-Type; signableHeaders buộc nó vào SignedHeaders
        // để R2 từ chối upload sai loại file.
        const url = await signUrl(s3Client, command, {
          expiresIn,
          signableHeaders: new Set(["content-type"]),
        });
        return { url, expiresAt: expiresAtFrom(expiresIn) };
      } catch (error) {
        throw toStorageError(error, "create upload URL");
      }
    },

    async createDownloadUrl({ key, expiresIn = defaultExpiresIn }) {
      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      try {
        const url = await signUrl(s3Client, command, { expiresIn });
        return { url, expiresAt: expiresAtFrom(expiresIn) };
      } catch (error) {
        throw toStorageError(error, "create download URL");
      }
    },

    async getObjectMetadata(key) {
      try {
        const output = await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
        return {
          contentType: output.ContentType ?? null,
          contentLength: output.ContentLength ?? null,
          etag: output.ETag ?? null,
        };
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") return null;
        throw toStorageError(error, "read object metadata");
      }
    },

    async deleteObject(key) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      } catch (error) {
        throw toStorageError(error, "delete object");
      }
    },

    getPublicUrl(key) {
      return publicBaseUrl ? `${publicBaseUrl}/${key}` : null;
    },
  };
};
