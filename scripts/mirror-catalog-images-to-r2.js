import { HeadObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";

import { createR2Client } from "../src/config/r2.js";
import { loadEnv } from "../src/config/env.js";
import { FoodItemsModel } from "../src/modules/food-items/food-items.model.js";
import { RecipesModel } from "../src/modules/recipes/recipes.model.js";
import {
  catalogImageObjectKey,
  catalogImageDigest,
  imageExtension,
  isExternalCatalogImage,
  parseCatalogImageMirrorArgs,
  runWithConcurrency,
} from "./lib/catalog-image-mirror.js";

const USER_AGENT =
  "VEGETA/1.0 (https://github.com/MMA-SuperOrganization/vegan-api-mma302; catalog image mirror)";

const fetchImage = async (sourceUrl, maxImageSizeBytes) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const contentType = response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase();
      if (!imageExtension(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
      const declaredSize = Number(response.headers.get("content-length") ?? 0);
      if (declaredSize > maxImageSizeBytes)
        throw new Error(`Image exceeds ${maxImageSizeBytes} bytes`);
      const body = Buffer.from(await response.arrayBuffer());
      if (!body.length || body.length > maxImageSizeBytes)
        throw new Error(`Downloaded image size is invalid (${body.length} bytes)`);
      return { body, contentType };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
};

const loadCandidates = async (publicBaseUrl, limit) => {
  const [foods, recipes] = await Promise.all([
    FoodItemsModel.find(
      { imageUrl: { $type: "string", $ne: "" } },
      { name: 1, imageUrl: 1 },
    ).lean(),
    RecipesModel.find(
      { coverImageUrl: { $type: "string", $ne: "" } },
      { title: 1, coverImageUrl: 1 },
    ).lean(),
  ]);
  const candidates = [
    ...foods.map((document) => ({
      kind: "food",
      id: document._id,
      label: document.name,
      sourceUrl: document.imageUrl,
    })),
    ...recipes.map((document) => ({
      kind: "recipe",
      id: document._id,
      label: document.title,
      sourceUrl: document.coverImageUrl,
    })),
  ].filter((candidate) => isExternalCatalogImage(candidate.sourceUrl, publicBaseUrl));
  return limit ? candidates.slice(0, limit) : candidates;
};

const updateCandidate = (candidate, mirror, objectKeyOnly = false) =>
  candidate.kind === "food"
    ? FoodItemsModel.updateOne(
        { _id: candidate.id, imageUrl: candidate.sourceUrl },
        {
          $set: {
            ...(objectKeyOnly
              ? { imageObjectKey: mirror.objectKey }
              : { imageUrl: mirror.publicUrl, imageObjectKey: mirror.objectKey }),
            updatedAt: new Date(),
          },
        },
      )
    : RecipesModel.updateOne(
        { _id: candidate.id, coverImageUrl: candidate.sourceUrl },
        {
          $set: {
            ...(objectKeyOnly
              ? { coverImageObjectKey: mirror.objectKey }
              : {
                  coverImageUrl: mirror.publicUrl,
                  coverImageObjectKey: mirror.objectKey,
                }),
            updatedAt: new Date(),
          },
        },
      );

const objectExists = async (client, bucketName, key) => {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") return false;
    throw error;
  }
};

const listCatalogImageKeys = async (client, bucketName) => {
  const keys = [];
  let continuationToken;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "catalog/images/",
        ContinuationToken: continuationToken,
      }),
    );
    keys.push(...(page.Contents ?? []).map(({ Key }) => Key).filter(Boolean));
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
};

const run = async () => {
  const options = parseCatalogImageMirrorArgs(process.argv.slice(2));
  const env = loadEnv();
  if (!env.r2.enabled) throw new Error("Cloudflare R2 must be configured");
  if (options.apply && !env.r2.publicBaseUrl)
    throw new Error("CLOUDFLARE_R2_PUBLIC_BASE_URL is required to update MongoDB");
  await mongoose.connect(env.database.uri, {
    dbName: env.database.dbName,
    serverSelectionTimeoutMS: env.database.serverSelectionTimeoutMs,
    autoIndex: false,
  });
  const candidates = await loadCandidates(env.r2.publicBaseUrl, options.limit);
  const uniqueSources = [...new Set(candidates.map(({ sourceUrl }) => sourceUrl))];
  console.log(
    JSON.stringify({
      mode: options.apply ? "apply" : options.uploadOnly ? "upload-only" : "preview",
      documents: candidates.length,
      uniqueImages: uniqueSources.length,
      byKind: {
        foods: candidates.filter(({ kind }) => kind === "food").length,
        recipes: candidates.filter(({ kind }) => kind === "recipe").length,
      },
    }),
  );
  if ((!options.apply && !options.uploadOnly) || !candidates.length) return;

  const client = createR2Client(env.r2);
  try {
    const existingKeys = await listCatalogImageKeys(client, env.r2.bucketName);
    const existingKeyByDigest = new Map(
      existingKeys.map((key) => [key.slice("catalog/images/".length).split(".", 1)[0], key]),
    );
    let completed = 0;
    const mirrors = await runWithConcurrency(
      uniqueSources,
      options.concurrency,
      async (sourceUrl) => {
        try {
          const existingKey = existingKeyByDigest.get(catalogImageDigest(sourceUrl));
          if (existingKey) {
            completed += 1;
            if (completed % 25 === 0 || completed === uniqueSources.length)
              console.log(JSON.stringify({ completed, total: uniqueSources.length }));
            return {
              sourceUrl,
              objectKey: existingKey,
              publicUrl: env.r2.publicBaseUrl
                ? `${env.r2.publicBaseUrl}/${existingKey}`
                : existingKey,
            };
          }
          const { body, contentType } = await fetchImage(sourceUrl, env.r2.maxImageSizeBytes);
          const key = catalogImageObjectKey(sourceUrl, contentType);
          const existed = await objectExists(client, env.r2.bucketName, key);
          if (!existed)
            await client.send(
              new PutObjectCommand({
                Bucket: env.r2.bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
                ContentLength: body.length,
                CacheControl: "public, max-age=31536000, immutable",
              }),
            );
          completed += 1;
          if (completed % 25 === 0 || completed === uniqueSources.length)
            console.log(JSON.stringify({ completed, total: uniqueSources.length }));
          return {
            sourceUrl,
            objectKey: key,
            publicUrl: env.r2.publicBaseUrl ? `${env.r2.publicBaseUrl}/${key}` : key,
          };
        } catch (error) {
          return { sourceUrl, error: error.message };
        }
      },
    );
    const failures = mirrors.filter(({ error }) => error);
    const successfulMirrors = mirrors.filter(({ error }) => !error);
    if (failures.length)
      console.warn(
        JSON.stringify({
          failed: failures.length,
          examples: failures.slice(0, 10),
        }),
      );
    if (options.uploadOnly) {
      const mirrorsBySource = new Map(
        successfulMirrors.map((mirror) => [mirror.sourceUrl, mirror]),
      );
      const keyUpdateResults = await runWithConcurrency(
        candidates.filter(({ sourceUrl }) => mirrorsBySource.has(sourceUrl)),
        options.concurrency,
        (candidate) => updateCandidate(candidate, mirrorsBySource.get(candidate.sourceUrl), true),
      );
      const databaseUpdated = keyUpdateResults.reduce(
        (sum, result) => sum + result.modifiedCount,
        0,
      );
      console.log(
        JSON.stringify({
          uploadedOrPresent: successfulMirrors.length,
          failed: failures.length,
          databaseUpdated,
        }),
      );
      return;
    }
    const mirrorsBySource = new Map(successfulMirrors.map((mirror) => [mirror.sourceUrl, mirror]));
    const updateCandidates = candidates.filter(({ sourceUrl }) => mirrorsBySource.has(sourceUrl));
    const updateResults = await runWithConcurrency(
      updateCandidates,
      options.concurrency,
      (candidate) => updateCandidate(candidate, mirrorsBySource.get(candidate.sourceUrl)),
    );
    const updated = updateResults.reduce((sum, result) => sum + result.modifiedCount, 0);
    console.log(
      JSON.stringify({
        uploadedOrPresent: successfulMirrors.length,
        failed: failures.length,
        updated,
      }),
    );
  } finally {
    client.destroy();
  }
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
