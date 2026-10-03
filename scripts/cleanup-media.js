import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase as connectDB, disconnectDatabase } from "../src/config/database.js";

export function parseCleanupArgs(args = []) {
  const options = { apply: false, limit: 50, olderThanHours: 24, help: false };
  let dryRun = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--help") options.help = true;
    else if (arg === "--limit" || arg === "--older-than-hours") {
      const value = Number(args[++index]);
      const min = arg === "--limit" ? 1 : 24,
        max = arg === "--limit" ? 100 : 8760;
      if (!Number.isInteger(value) || value < min || value > max)
        throw new Error(`${arg} requires an integer from ${min} to ${max}`);
      options[arg === "--limit" ? "limit" : "olderThanHours"] = value;
    } else throw new Error(`Unknown cleanup option: ${arg}`);
  }
  if (dryRun && options.apply) throw new Error("Choose --apply OR --dry-run");
  return options;
}
export function pendingCleanupFilter({ ownerId, now = new Date(), olderThanHours = 24 }) {
  return {
    ownerId,
    status: "pending",
    deletedAt: null,
    createdAt: { $lt: new Date(now.getTime() - olderThanHours * 3600000) },
    uploadExpiresAt: { $lt: now },
    "references.0": { $exists: false },
    linkedEntityId: null,
  };
}
export async function runCleanup(
  container,
  { apply = false, limit = 50, olderThanHours = 24, now = new Date() } = {},
) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isInteger(olderThanHours) ||
    olderThanHours < 24 ||
    olderThanHours > 8760
  )
    throw new Error("Invalid cleanup bounds");
  const { repositories, env, logger, operations } = container;
  const uid = env.seed?.adminFirebaseUid;
  if (!uid || /change_me|placeholder/i.test(uid) || uid.startsWith("internal:"))
    throw new Error(
      "Set a real SEED_ADMIN_FIREBASE_UID; cleanup is scoped to that active admin's own uploads",
    );
  const user = await repositories.users.findOne({
    firebaseUid: uid,
    role: "admin",
    status: "active",
    deletedAt: null,
  });
  if (!user) throw new Error("Configured cleanup admin does not exist or is not active");
  const actor = { userId: user._id, firebaseUid: user.firebaseUid, role: "admin" };
  const repo = repositories.mediaAssets;
  if (!repo) throw new Error("Missing canonical mediaAssets repository");
  const filter = pendingCleanupFilter({ ownerId: user._id, now, olderThanHours });
  const result = await repo.findMany(filter, { limit, sort: { createdAt: 1, _id: 1 } });
  const report = {
    mode: apply ? "apply" : "dry-run",
    ownerId: String(user._id),
    candidates: result.data.length,
    deleted: 0,
    skipped: 0,
    failed: 0,
    assets: [],
  };
  if (apply && (!container.providers?.storage || !operations.deleteMediaAsset))
    throw new Error(
      "Apply requires the configured storage provider and canonical deleteMediaAsset operation",
    );
  for (const asset of result.data) {
    const id = String(asset._id);
    if (
      !asset.objectKey?.startsWith(`users/${user._id}/`) ||
      (asset.bucket && asset.bucket !== env.r2.bucketName)
    ) {
      report.skipped++;
      report.assets.push({ id, status: "unsafe_namespace_or_bucket" });
      continue;
    }
    if (!apply) {
      report.assets.push({ id, status: "would_delete_expired_owned_pending" });
      continue;
    }
    // Atomic pending -> deleting claim prevents confirmation from racing this cleanup.
    // Never delete a newly ready upload, any other owner's upload, or referenced content.
    const claimed = await repo.updateOne(
      {
        ...filter,
        _id: asset._id,
        ...(asset.version === undefined
          ? { version: { $exists: false } }
          : { version: asset.version }),
      },
      { $set: { status: "deleting", deletionError: false }, $inc: { version: 1 } },
    );
    if (!claimed) {
      report.skipped++;
      report.assets.push({ id, status: "changed_since_inventory" });
      continue;
    }
    try {
      const deleted = await operations.deleteMediaAsset({ actor, params: { id: asset._id } });
      if (deleted.status !== "deleted") throw new Error("Deletion did not complete");
      report.deleted++;
      report.assets.push({ id, status: "deleted" });
    } catch (error) {
      report.failed++;
      report.assets.push({ id, status: "failed", code: error.code ?? "DELETE_FAILED" });
    }
  }
  logger.info({ report }, "Media cleanup: no public URLs, object keys or credentials logged");
  return report;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseCleanupArgs(args);
  if (options.help) {
    console.log(
      "cleanup-media [--dry-run | --apply] [--limit 1..100] [--older-than-hours 24..8760]\nDefault read-only inventory. Only expired pending uploads owned by the explicitly configured active seed admin are eligible. Ready/referenced/other-owner uploads are never selected.",
    );
    return;
  }
  const env = loadEnv();
  if (!env.database.uri)
    throw new Error("A configured MongoDB URI is required for cleanup inventory");
  const logger = createLogger(env);
  const { createContainer } = await import("../src/container.js");
  const overrides = {
    authProvider: null,
    aiProvider: null,
    messagingProvider: null,
    ...(!options.apply ? { storageProvider: null } : {}),
  };
  const container = createContainer({ env, logger, overrides });
  try {
    await connectDB({ ...env.database, logger });
    return await runCleanup(container, options);
  } finally {
    await disconnectDatabase();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
