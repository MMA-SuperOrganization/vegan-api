import { S3Client } from "@aws-sdk/client-s3";

/**
 * Tạo S3Client trỏ tới Cloudflare R2 (S3-compatible API).
 * @param {{ accountId: string, accessKeyId: string, secretAccessKey: string }} r2Env
 */
export const createR2Client = ({ accountId, accessKeyId, secretAccessKey }) =>
  new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // R2 chưa hỗ trợ đầy đủ checksum mặc định mới của AWS SDK v3; chỉ tính khi bắt buộc.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
