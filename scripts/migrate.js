import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase as connectDB, disconnectDatabase } from "../src/config/database.js";

// Casing is significant in MongoDB. Aliases are inventoried, NEVER merged automatically.
export const LEGACY_COLLECTIONS = Object.freeze({
  users: [],
  userProfiles: ["userprofiles"],
  nutritionprofiles: ["nutritionProfiles"],
  categories: [],
  allergens: [],
  fooditems: ["foodItems"],
  recipes: [],
  posts: [],
  videos: [],
  pantries: ["pantryitems"],
  mealplans: ["mealPlans"],
  grocerylists: ["groceryLists"],
  diaries: ["diaryEntries", "diaryentries"],
  weightlogs: ["weightLogs"],
  waterlogs: ["waterLogs"],
  media: ["mediaAssets", "mediaassets"],
  comments: [],
  reactions: [],
  ratings: [],
  saveditems: ["savedItems"],
  viewhistories: ["viewHistories"],
  searchhistories: ["searchHistories"],
  aiConversations: ["aiconversations"],
  aiMessages: ["aimessages"],
  aiRuns: ["airuns"],
  aiFeedback: ["aifeedback", "aifeedbacks"],
  aiProposals: ["aiproposals"],
  notifications: [],
  notificationPreferences: ["notificationpreferences"],
  reminders: [],
  reports: [],
  moderations: ["moderationCases", "moderationcases"],
  auditlogs: ["auditLogs"],
  adminguards: [],
});
export function parseMigrationArgs(args = []) {
  const allowed = new Set(["--apply", "--dry-run", "--help"]);
  for (const arg of args)
    if (!allowed.has(arg)) throw new Error(`Unknown migration option: ${arg}`);
  if (args.includes("--apply") && args.includes("--dry-run"))
    throw new Error("Choose --apply OR --dry-run");
  return { apply: args.includes("--apply"), help: args.includes("--help") };
}
const owns = (doc, key) => Object.hasOwn(doc, key);
export function planDocumentMigration(
  doc,
  { roleValues = [], statusValues = [], hasVersion = false, required = [] } = {},
) {
  const set = {},
    conflicts = [],
    observations = [];
  for (const key of required)
    if (doc[key] === undefined || doc[key] === null || doc[key] === "")
      conflicts.push(`Missing required canonical field: ${key}`);
  if (roleValues.length) {
    if (!owns(doc, "role") && roleValues.includes("user"))
      set.role = "user"; // Never elevate an unknown account.
    else if (typeof doc.role === "string" && roleValues.includes(doc.role.toLowerCase())) {
      if (doc.role !== doc.role.toLowerCase()) set.role = doc.role.toLowerCase();
    } else conflicts.push("Unknown user role; manual review required");
  }
  if (statusValues.length) {
    const fromFlag =
      typeof doc.isActive === "boolean" && statusValues.includes("inactive")
        ? doc.isActive
          ? "active"
          : "inactive"
        : undefined;
    if (typeof doc.status === "string" && statusValues.includes(doc.status.toLowerCase())) {
      const value = doc.status.toLowerCase();
      if (fromFlag && fromFlag !== value)
        conflicts.push("Conflicting status and isActive; no automatic winner");
      else if (doc.status !== value) set.status = value;
    } else if (!owns(doc, "status") && fromFlag) set.status = fromFlag;
    else conflicts.push("Missing/unknown canonical status; no automatic activation or publishing");
  }
  if (hasVersion) {
    if (!owns(doc, "version")) set.version = 0;
    else if (!Number.isSafeInteger(doc.version) || doc.version < 0)
      conflicts.push("Invalid version; no counter reset");
  }
  if (
    doc.nutritionPer100g &&
    ["calories", "protein", "fat", "carbs", "fiber"].some((key) => owns(doc.nutritionPer100g, key))
  )
    conflicts.push("Legacy nutrient units need reviewed normalization; not overwritten");
  for (const key of ["userId", "authorId", "ownerId", "categoryId", "foodItemId", "targetId"])
    if (typeof doc[key] === "string")
      observations.push(
        `String reference ${key}; review ObjectId conversion and orphan references manually`,
      );
  const filter = { _id: doc._id };
  for (const key of ["role", "status", "isActive", "version"])
    filter[key] = owns(doc, key) ? doc[key] : { $exists: false };
  return { set, filter, conflicts, observations };
}
export function canonicalMigrationPolicy(model) {
  return {
    roleValues:
      model.collection.name === "users" ? (model.schema.path("role")?.enumValues ?? []) : [],
    statusValues: model.schema.path("status")?.enumValues ?? [],
    hasVersion: Boolean(model.schema.path("version")),
    required: model.schema
      .requiredPaths()
      .filter((key) => !key.includes(".") && !["role", "status", "version"].includes(key)),
  };
}
export async function runMigration(container, { apply = false, maxDocuments = 10000 } = {}) {
  const { models, logger } = container;
  const canonical = new Map(
    Object.values(models)
      .filter((model) => model?.collection?.name)
      .map((model) => [model.collection.name, model]),
  );
  if (!canonical.size) throw new Error("Container exposes no canonical models");
  const connection = canonical.values().next().value.db;
  const present = new Set(
    (await connection.db.listCollections({}, { nameOnly: true }).toArray()).map(
      (item) => item.name,
    ),
  );
  const report = {
    mode: apply ? "apply" : "dry-run",
    collections: [],
    scanned: 0,
    planned: 0,
    applied: 0,
    conflicts: 0,
    manualReview: 0,
    truncated: false,
  };
  const changes = [];
  for (const [name, model] of canonical) {
    const aliases = (LEGACY_COLLECTIONS[name] ?? []).filter(
      (alias) => present.has(alias) && !canonical.has(alias),
    );
    const item = {
      collection: name,
      exists: present.has(name),
      legacyAliases: [],
      scanned: 0,
      planned: 0,
      conflicts: [],
      observations: [],
    };
    for (const alias of aliases)
      item.legacyAliases.push({
        collection: alias,
        documents: await connection.db.collection(alias).countDocuments({}),
        action: "manual reviewed copy with _id/snapshots preserved; NOT applied",
      });
    if (aliases.length) report.manualReview += aliases.length;
    if (item.exists) {
      const collection = connection.db.collection(name);
      const policy = canonicalMigrationPolicy(model);
      if (name === "mealplans") {
        const indexes = await collection.listIndexes().toArray();
        if (indexes.some((index) => index.name === "one_active_plan_per_owner_week")) {
          item.observations.push({
            reason:
              "Legacy partial active-plan index must be explicitly replaced after reviewed unique owner/week slot backfill; no live index drop is performed",
          });
          report.manualReview++;
        }
        const active = await collection
          .find({ status: "active" })
          .limit(maxDocuments + 1)
          .toArray();
        const keys = new Set();
        for (const plan of active.slice(0, maxDocuments)) {
          const key = `${plan.userId}:${new Date(plan.weekStartDate).getTime()}`;
          if (keys.has(key)) {
            item.conflicts.push({
              id: String(plan._id),
              reason:
                "Duplicate active owner/week plans require manual reconciliation before slot backfill",
            });
            report.conflicts++;
          }
          keys.add(key);
          const slot = present.has("mealplanactiveslots")
            ? await connection.db
                .collection("mealplanactiveslots")
                .findOne({ userId: plan.userId, weekStartDate: plan.weekStartDate })
            : null;
          if (!slot || String(slot.activePlanId) !== String(plan._id)) {
            item.observations.push({
              id: String(plan._id),
              reason:
                "Active plan lacks a matching stable owner/week pointer; manual reviewed slot backfill required",
            });
            report.manualReview++;
          }
        }
        if (active.length > maxDocuments) report.truncated = true;
      }
      const docs = await collection
        .find({})
        .limit(maxDocuments + 1)
        .toArray();
      if (docs.length > maxDocuments) report.truncated = true;
      for (const doc of docs.slice(0, maxDocuments)) {
        const plan = planDocumentMigration(doc, policy);
        item.scanned++;
        report.scanned++;
        for (const reason of plan.conflicts) {
          item.conflicts.push({ id: String(doc._id), reason });
          report.conflicts++;
        }
        for (const reason of plan.observations) {
          item.observations.push({ id: String(doc._id), reason });
          report.manualReview++;
        }
        if (!plan.conflicts.length && Object.keys(plan.set).length) {
          changes.push({ collection, ...plan });
          item.planned++;
          report.planned++;
        }
      }
    }
    report.collections.push(item);
  }
  logger.info(
    { report },
    "Persistence migration inventory (no tokens, prompts or nutrition snapshots logged)",
  );
  if (!apply) return report;
  if (report.conflicts || report.manualReview || report.truncated)
    throw new Error(
      "Apply refused: conflicts, legacy aliases/string references, or scan limit require manual review. No writes performed.",
    );
  if (!changes.length) return report;
  const session = await connection.startSession();
  try {
    await session.withTransaction(async () => {
      let applied = 0;
      for (const change of changes) {
        const result = await change.collection.updateOne(
          change.filter,
          { $set: change.set },
          { session },
        );
        if (result.matchedCount !== 1)
          throw new Error(
            "Migration conflict: record changed since inventory; transaction rolled back",
          );
        applied += result.modifiedCount;
      }
      report.applied = applied;
    });
  } finally {
    await session.endSession();
  }
  logger.info(
    { planned: report.planned, applied: report.applied },
    "Safe normalization committed; IDs, references, snapshots and legacy fields preserved",
  );
  return report;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseMigrationArgs(args);
  if (options.help) {
    console.log(
      "migrate [--dry-run | --apply]\nDefault inventories MongoDB read-only. Apply only normalizes recognized role/status and initializes absent versions in a transaction. Legacy collection copies require manual review.",
    );
    return;
  }
  const env = loadEnv();
  if (!env.database.uri)
    throw new Error("A configured MongoDB URI is required for migration inventory");
  const logger = createLogger(env);
  const { createContainer } = await import("../src/container.js");
  const container = createContainer({
    env,
    logger,
    overrides: {
      authProvider: null,
      storageProvider: null,
      aiProvider: null,
      messagingProvider: null,
    },
  });
  try {
    await connectDB({ ...env.database, logger });
    return await runMigration(container, options);
  } finally {
    await disconnectDatabase();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
