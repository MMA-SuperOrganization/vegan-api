import { AppError } from "../../common/errors/app-error.js";
import { requireAdmin, transaction, auditAdmin, casFilter } from "../recipes/index.js";

export const pendingCleanupFilter = ({ ownerId, now = new Date(), olderThanHours = 24 }) => ({
  ...(ownerId ? { ownerId } : {}),
  status: { $in: ["pending", "rejected", "deleting"] },
  deletedAt: null,
  createdAt: { $lt: new Date(now.getTime() - olderThanHours * 3600000) },
  $or: [{ uploadExpiresAt: { $lt: now } }, { uploadExpiresAt: { $exists: false } }],
  "references.0": { $exists: false },
  linkedEntityId: null,
});

export const createMediaCleanup =
  (deps, deleteAsset) =>
  async ({
    actor,
    apply = false,
    ownerId,
    allOwners = false,
    limit = 50,
    olderThanHours = 24,
    now = new Date(deps.clock ? deps.clock() : Date.now()),
  } = {}) => {
    requireAdmin(actor);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(olderThanHours) ||
      olderThanHours < 24 ||
      olderThanHours > 8760
    )
      throw AppError.badRequest("Invalid cleanup bounds");
    if (allOwners && ownerId) throw AppError.badRequest("Choose ownerId or allOwners");
    const scopedOwner = allOwners ? undefined : (ownerId ?? actor.userId);
    const filter = pendingCleanupFilter({ ownerId: scopedOwner, now, olderThanHours });
    const repo = deps.repositories.mediaAssets;
    const result = await repo.findMany(filter, { limit, sort: { createdAt: 1, _id: 1 } });
    const report = {
      mode: apply ? "apply" : "dry-run",
      ownerId: scopedOwner ? String(scopedOwner) : null,
      candidates: result.data.length,
      deleted: 0,
      skipped: 0,
      failed: 0,
      assets: [],
    };
    for (const asset of result.data) {
      const id = String(asset._id);
      if (
        !asset.objectKey?.startsWith(`users/${asset.ownerId}/`) ||
        !asset.bucket ||
        asset.bucket !== deps.env.r2.bucketName
      ) {
        report.skipped++;
        report.assets.push({ id, status: "unsafe_namespace_or_bucket" });
        continue;
      }
      if (!apply) {
        report.assets.push({ id, status: "would_delete_expired_unreferenced" });
        continue;
      }
      try {
        const claimed = await transaction(deps, async (session) => {
          const after = await repo.updateOne(
            { $and: [filter, casFilter(asset)] },
            { $set: { status: "deleting", deletionError: false }, $inc: { version: 1 } },
            { session },
          );
          if (after)
            await auditAdmin(
              deps,
              { actor },
              "media",
              asset,
              after,
              "media.cleanup.claim",
              session,
            );
          return after;
        });
        if (!claimed) {
          report.skipped++;
          report.assets.push({ id, status: "changed_since_inventory" });
          continue;
        }
        await deleteAsset({ actor, params: { id: asset._id } });
        report.deleted++;
        report.assets.push({ id, status: "deleted" });
      } catch (error) {
        report.failed++;
        report.assets.push({ id, status: "failed", code: error.code ?? "DELETE_FAILED" });
      }
    }
    return report;
  };
