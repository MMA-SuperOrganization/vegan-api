import { createHash } from "node:crypto";

const IMAGE_CONTENT_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

export const parseCatalogImageMirrorArgs = (args = []) => {
  const options = { apply: false, uploadOnly: false, concurrency: 4, limit: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--upload-only") options.uploadOnly = true;
    else if (arg === "--concurrency" || arg === "--limit") {
      const value = Number(args[++index]);
      const maximum = arg === "--concurrency" ? 10 : 10000;
      if (!Number.isInteger(value) || value < 1 || value > maximum)
        throw new Error(`${arg} requires an integer from 1 to ${maximum}`);
      options[arg === "--concurrency" ? "concurrency" : "limit"] = value;
    } else throw new Error(`Unsupported argument: ${arg}`);
  }
  if (options.apply && options.uploadOnly) throw new Error("Choose --apply or --upload-only");
  return options;
};

export const isExternalCatalogImage = (imageUrl, publicBaseUrl) => {
  if (!imageUrl) return false;
  try {
    const image = new URL(imageUrl);
    if (image.protocol !== "https:") return false;
    return publicBaseUrl ? image.origin !== new URL(publicBaseUrl).origin : true;
  } catch {
    return false;
  }
};

export const imageExtension = (contentType) =>
  IMAGE_CONTENT_TYPES.get(contentType?.split(";", 1)[0]?.trim().toLowerCase()) ?? null;

export const catalogImageDigest = (sourceUrl) =>
  createHash("sha256").update(sourceUrl).digest("hex");

export const catalogImageObjectKey = (sourceUrl, contentType) => {
  const extension = imageExtension(contentType);
  if (!extension) throw new Error(`Unsupported image content type: ${contentType ?? "missing"}`);
  return `catalog/images/${catalogImageDigest(sourceUrl)}.${extension}`;
};

export const runWithConcurrency = async (values, concurrency, task) => {
  const results = new Array(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await task(values[currentIndex], currentIndex);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
};
