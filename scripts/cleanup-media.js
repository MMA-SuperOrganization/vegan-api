import { pendingCleanupFilter } from "../src/modules/media/index.js";
export { pendingCleanupFilter };
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
    else if (arg === "--all-owners") options.allOwners = true;
    else if (arg === "--owner-id") {
      const id = args[++index];
      if (!/^[a-f\d]{24}$/i.test(id ?? ""))
        throw new Error("--owner-id requires a MongoDB ObjectId");
      options.ownerId = id;
    } else if (arg === "--limit" || arg === "--older-than-hours") {
      const value = Number(args[++index]);
      const min = arg === "--limit" ? 1 : 24,
        max = arg === "--limit" ? 100 : 8760;
      if (!Number.isInteger(value) || value < min || value > max)
        throw new Error(`${arg} requires an integer from ${min} to ${max}`);
      options[arg === "--limit" ? "limit" : "olderThanHours"] = value;
    } else throw new Error(`Unknown cleanup option: ${arg}`);
  }
  if (dryRun && options.apply) throw new Error("Choose --apply OR --dry-run");
  if (options.allOwners && options.ownerId) throw new Error("Choose --owner-id or --all-owners");
  return options;
}
export async function runCleanup(container, options = {}) {
  const uid = container.env.seed?.adminFirebaseUid;
  if (!uid || /change_me|placeholder/i.test(uid) || uid.startsWith("internal:"))
    throw new Error("Set a real SEED_ADMIN_FIREBASE_UID for the cleanup administrator");
  const user = await container.repositories.users.findOne({
    firebaseUid: uid,
    role: "admin",
    status: "active",
    deletedAt: null,
  });
  if (!user) throw new Error("Configured cleanup admin does not exist or is not active");
  const report = await container.services.media.cleanupPending({
    ...options,
    actor: { userId: user._id, role: "admin", status: "active" },
  });
  container.logger.info({ report }, "Media cleanup completed");
  return report;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseCleanupArgs(args);
  if (options.help) {
    console.log(
      "cleanup-media [--dry-run | --apply] [--limit 1..100] [--older-than-hours 24..8760] [--owner-id <ObjectId> | --all-owners]\nDefault read-only inventory. Expired unreferenced pending/rejected/deleting uploads only. Default owner is the seed admin; use --owner-id <ObjectId> or --all-owners for an explicit broader scope.",
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
