import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { requireFound, assertOwner, objectIdString } from "../../common/domain.js";
import {
  requireActor,
  requireAdmin,
  transaction,
  now,
  auditAdmin,
  casUpdate,
  casFilter,
  isPublic,
} from "../recipes/content.service.js";

export const createMediaService = (deps) => {
  const repo = deps.repositories.mediaAssets;
  const provider = () => {
    if (!deps.storageProvider) throw AppError.serviceUnavailable("Storage is not configured");
    return deps.storageProvider;
  };
  const expires = () =>
    Math.min(
      900,
      Math.max(
        60,
        deps.env?.r2?.presignedUrlExpiresIn ??
          deps.env?.R2_PRESIGNED_URL_EXPIRES_SECONDS ??
          deps.env?.R2_PRESIGNED_URL_TTL_SECONDS ??
          deps.env?.R2_PRESIGNED_EXPIRES_IN ??
          300,
      ),
    );
  const assertReady = async (ids, { actor, ownerId, kind, purpose, session } = {}) => {
    requireActor(actor);
    const results = [];
    for (const id of [...new Set(ids.map(objectIdString))]) {
      const asset = requireFound(await repo.findById(id, { session }), "Media asset not found");
      if (asset.status !== "ready" || asset.deletedAt)
        throw AppError.conflict("Only ready media can be linked");
      const expectedOwner = objectIdString(ownerId ?? actor.userId);
      if (objectIdString(asset.ownerId) !== expectedOwner)
        throw AppError.forbidden("Media must belong to the content owner");
      if (actor.role !== "admin" && expectedOwner !== objectIdString(actor.userId))
        throw AppError.forbidden();
      if (kind && asset.kind !== kind) throw AppError.badRequest("Media has the wrong kind");
      if (purpose && ![].concat(purpose).includes(asset.purpose))
        throw AppError.badRequest("Media has the wrong purpose");
      // Writing the readiness guard inside the entity transaction conflicts with a concurrent delete.
      if (session) {
        const locked = await repo.updateOne(
          { ...casFilter(asset), status: "ready", deletedAt: null },
          { $inc: { version: 1 } },
          { session },
        );
        if (!locked) throw AppError.conflict("Media changed during linking");
        results.push(locked);
      } else {
        results.push(asset);
      }
    }
    return results;
  };
  const link = async (id, entityType, entityId, { actor, session } = {}) => {
    requireActor(actor);
    const asset = requireFound(await repo.findById(id, { session }));
    assertOwner(asset, actor, { field: "ownerId", allowAdmin: true });
    if (asset.status !== "ready" || asset.deletedAt)
      throw AppError.conflict("Only ready media can be linked");
    const result = await repo.updateOne(
      { ...casFilter(asset), status: "ready" },
      { $addToSet: { references: { entityType, entityId } }, $inc: { version: 1 } },
      { session },
    );
    if (!result) throw AppError.conflict("Media changed during linking");
    return result;
  };
  const unlink = async (id, entityType, entityId, { actor, session } = {}) => {
    requireActor(actor);
    const asset = await repo.findById(id, { session });
    if (!asset) return null;
    assertOwner(asset, actor, { field: "ownerId", allowAdmin: true });
    const result = await repo.updateOne(
      casFilter(asset),
      { $pull: { references: { entityType, entityId } }, $inc: { version: 1 } },
      { session },
    );
    if (!result) throw AppError.conflict("Media changed during unlinking");
    return result;
  };
  const referencedDocuments = async (asset, { session, publicOnly = false } = {}) => {
    const id = asset._id;
    const found = [];
    const queries = [
      [
        "recipe",
        "recipes",
        { $or: [{ coverMediaId: id }, { mediaIds: id }, { "steps.mediaId": id }] },
      ],
      ["post", "posts", { mediaIds: id }],
      ["video", "videos", { $or: [{ videoMediaId: id }, { thumbnailMediaId: id }] }],
    ];
    for (const [type, key, filter] of queries) {
      const repository = deps.repositories[key];
      if (!repository) continue;
      const result = await repository.findMany(
        {
          ...filter,
          deletedAt: null,
          status: publicOnly ? "published" : { $ne: "deleted" },
          ...(publicOnly ? { visibility: "public" } : {}),
        },
        { limit: 100, session },
      );
      for (const document of result.data) found.push({ type, document });
    }
    // Avatars may be linked by the identity service. Ignore deleted/suspended accounts.
    if (deps.repositories.users) {
      const user = await deps.repositories.users.findOne(
        { avatarMediaId: id, status: "active", deletedAt: null },
        { session },
      );
      if (user) found.push({ type: "user", document: user });
    }
    return found;
  };
  const authorized = async (asset, actor) => {
    if (
      actor &&
      (objectIdString(asset.ownerId) === objectIdString(actor.userId) || actor.role === "admin")
    )
      return true;
    if (asset.status !== "ready" || asset.deletedAt) return false;
    return (await referencedDocuments(asset, { publicOnly: true })).length > 0;
  };
  const present = async (asset, { download = false } = {}) => {
    const result = {
      _id: asset._id,
      ownerId: asset.ownerId,
      kind: asset.kind,
      purpose: asset.purpose,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      status: asset.status,
      confirmedAt: asset.confirmedAt ?? null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
    if (download && asset.status === "ready") {
      const storage = provider();
      // Always use authorized, short-lived GET URLs. Never synthesize a public CDN URL for a
      // draft/private upload. If signed GET is unavailable, fail closed rather than leak a key.
      if (!storage.createDownloadUrl)
        throw AppError.serviceUnavailable("Private media downloads are not configured");
      const signed = await storage.createDownloadUrl({
        key: asset.objectKey,
        expiresIn: expires(),
      });
      result.url = signed.url;
      result.downloadUrl = signed.url;
      result.expiresAt = signed.expiresAt;
    }
    return result;
  };
  const getById = async (id, { actor } = {}) => {
    const asset = requireFound(await repo.findById(id));
    if (asset.status === "deleted" || asset.deletedAt || !(await authorized(asset, actor)))
      throw AppError.notFound();
    return present(asset, { download: asset.status === "ready" });
  };
  const getOwnedReady = async (userId, id, { type } = {}) => {
    const asset = requireFound(await repo.findById(id));
    assertOwner(asset, { userId }, { field: "ownerId" });
    if (asset.status !== "ready" || asset.deletedAt) throw AppError.conflict("Media is not ready");
    if (type && asset.kind !== type) throw AppError.badRequest("Media has the wrong kind");
    return {
      ...(await present(asset, { download: true })),
      objectKey: asset.objectKey,
      key: asset.objectKey,
    };
  };
  const deleteAsset = async (context) => {
    const { actor, params } = context;
    requireActor(actor);
    const storage = provider();
    const claimed = await transaction(deps, async (session) => {
      const asset = requireFound(await repo.findById(params.id, { session }));
      assertOwner(asset, actor, { field: "ownerId", allowAdmin: true });
      if (asset.status === "deleted") return asset;
      if (
        (asset.references ?? []).length ||
        asset.linkedEntityId ||
        (await referencedDocuments(asset, { session })).length
      )
        throw AppError.conflict("Media is still referenced by content", [], "MEDIA_IN_USE");
      if (asset.status === "deleting") return asset;
      const after = await casUpdate(
        repo,
        asset,
        { status: "deleting", deletionError: false },
        { session },
      );
      await auditAdmin(deps, context, "media", asset, after, "media.delete.request", session);
      return after;
    });
    if (claimed.status === "deleted") return { _id: claimed._id, status: "deleted" };
    try {
      await storage.deleteObject(claimed.objectKey);
    } catch (error) {
      await repo.updateOne(
        { _id: claimed._id, status: "deleting" },
        { $set: { deletionError: true }, $inc: { version: 1 } },
      );
      throw error;
    }
    return transaction(deps, async (session) => {
      const current = requireFound(await repo.findById(claimed._id, { session }));
      if (current.status === "deleted") return { _id: current._id, status: "deleted" };
      if (current.status !== "deleting") throw AppError.conflict("Media deletion state changed");
      const after = await casUpdate(
        repo,
        current,
        { status: "deleted", deletedAt: now(deps), deletionError: false },
        { session },
      );
      await auditAdmin(deps, context, "media", current, after, "media.delete", session);
      return { _id: after._id, status: "deleted" };
    });
  };
  const operations = {
    createUploadRequest: async ({ actor, body }) => {
      requireActor(actor);
      const storage = provider();
      const kind = body.mimeType.startsWith("image/") ? "image" : "video";
      const max =
        kind === "image"
          ? (deps.env?.r2?.maxImageSizeBytes ??
            deps.env?.MEDIA_MAX_IMAGE_BYTES ??
            deps.env?.MAX_IMAGE_SIZE_BYTES ??
            10 * 1024 * 1024)
          : (deps.env?.r2?.maxVideoSizeBytes ??
            deps.env?.MEDIA_MAX_VIDEO_BYTES ??
            deps.env?.MAX_VIDEO_SIZE_BYTES ??
            200 * 1024 * 1024);
      if (body.sizeBytes > max)
        throw AppError.badRequest("Media exceeds the configured size limit");
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "video/mp4": "mp4",
        "video/webm": "webm",
      }[body.mimeType];
      if (!extension) throw AppError.badRequest("Unsupported media MIME type");
      const objectKey = `users/${actor.userId}/${body.purpose}/${now(deps).toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
      const asset = await repo.create({
        ownerId: actor.userId,
        objectKey,
        bucket: deps.env?.r2?.bucketName ?? deps.env?.R2_BUCKET_NAME ?? deps.env?.R2_BUCKET,
        kind,
        purpose: body.purpose,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        status: "pending",
        references: [],
        version: 0,
        deletedAt: null,
        uploadExpiresAt: new Date(now(deps).getTime() + expires() * 1000),
      });
      let signed;
      try {
        signed = await storage.createUploadUrl({
          key: objectKey,
          contentType: body.mimeType,
          contentLength: body.sizeBytes,
          expiresIn: expires(),
        });
      } catch (error) {
        await repo.updateOne(
          { _id: asset._id, status: "pending" },
          { $set: { status: "rejected" }, $inc: { version: 1 } },
        );
        throw error;
      }
      return {
        assetId: asset._id,
        mediaAssetId: asset._id,
        _id: asset._id,
        status: "pending",
        method: "PUT",
        uploadUrl: signed.url,
        expiresAt: signed.expiresAt,
        expiresIn: expires(),
        requiredHeaders: {
          "Content-Type": body.mimeType,
          "Content-Length": String(body.sizeBytes),
        },
        headers: { "Content-Type": body.mimeType, "Content-Length": String(body.sizeBytes) },
      };
    },
    getMyMedia: async ({ actor, query = {} }) => {
      requireActor(actor);
      const list = await repo.findMany(
        {
          ownerId: actor.userId,
          ...(query.status ? { status: query.status } : { status: { $ne: "deleted" } }),
          ...(query.purpose ? { purpose: query.purpose } : {}),
        },
        { page: query.page ?? 1, limit: query.limit ?? 20, sort: { createdAt: -1, _id: -1 } },
      );
      return { ...list, data: await Promise.all(list.data.map((asset) => present(asset))) };
    },
    confirmMediaUpload: async ({ actor, params }) => {
      requireActor(actor);
      const asset = requireFound(await repo.findById(params.id));
      assertOwner(asset, actor, { field: "ownerId" });
      if (asset.status === "ready") return present(asset, { download: true });
      if (asset.status !== "pending")
        throw AppError.conflict("Only pending uploads can be confirmed");
      const metadata = await provider().getObjectMetadata(asset.objectKey);
      if (!metadata) throw AppError.badRequest("Uploaded object was not found");
      if (
        metadata.contentType?.split(";")[0].trim().toLowerCase() !== asset.mimeType ||
        metadata.contentLength !== asset.sizeBytes
      ) {
        await casUpdate(repo, asset, { status: "rejected" });
        throw AppError.badRequest("Uploaded object MIME type or size does not match the request");
      }
      const ready = await casUpdate(repo, asset, {
        status: "ready",
        etag: metadata.etag,
        confirmedAt: now(deps),
      });
      return present(ready, { download: true });
    },
    getMediaAsset: async ({ actor, params }) => getById(params.id, { actor }),
    deleteMediaAsset: deleteAsset,
  };
  const cleanupPending = async ({
    actor,
    olderThan = new Date(now(deps).getTime() - 86400000),
    limit = 50,
  } = {}) => {
    requireAdmin(actor);
    const pending = await repo.findMany(
      { status: { $in: ["pending", "rejected", "deleting"] }, createdAt: { $lt: olderThan } },
      { limit: Math.min(limit, 100), sort: { createdAt: 1 } },
    );
    const results = [];
    for (const asset of pending.data) {
      try {
        results.push(await deleteAsset({ actor, params: { id: asset._id } }));
      } catch (error) {
        results.push({ _id: asset._id, code: error.code ?? "DELETE_FAILED" });
      }
    }
    return results;
  };
  return {
    operations,
    service: { getById, getOwnedReady, assertReady, link, unlink, cleanupPending },
  };
};
