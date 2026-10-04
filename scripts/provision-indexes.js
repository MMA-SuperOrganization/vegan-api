import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

const OLD_INDEX = "one_active_plan_per_owner_week";
const ownerWeek = (row) => `${row.userId}:${new Date(row.weekStartDate).toISOString()}`;
const snapshot = (plans) =>
  plans
    .map((row) => `${ownerWeek(row)}:${row._id}:${row.version ?? 0}`)
    .sort()
    .join("|");
export const planActiveSlots = (plans, slots) => {
  const active = new Map();
  for (const row of plans) {
    const key = ownerWeek(row);
    if (active.has(key))
      throw new Error("Conflicting active plans for one owner/week; resolve before provisioning");
    active.set(key, row);
  }
  const existing = new Map();
  for (const slot of slots) {
    const key = ownerWeek(slot);
    if (existing.has(key)) throw new Error("Duplicate owner/week slots; manual review required");
    existing.set(key, slot);
    if (slot.activePlanId && String(active.get(key)?._id) !== String(slot.activePlanId))
      throw new Error("Existing active slot disagrees with active plans; manual review required");
  }
  return plans.filter((plan) => !existing.get(ownerWeek(plan))?.activePlanId);
};
export const parseProvisionArgs = (args) => {
  for (const arg of args)
    if (
      !["--apply", "--dry-run", "--maintenance", "--retire-old-active-index", "--help"].includes(
        arg,
      )
    )
      throw new Error("Unknown provisioning option");
  if (args.includes("--apply") && args.includes("--dry-run"))
    throw new Error("Choose apply or dry-run");
  const options = {
    apply: args.includes("--apply"),
    maintenance: args.includes("--maintenance"),
    retireOldActiveIndex: args.includes("--retire-old-active-index"),
    help: args.includes("--help"),
  };
  if (options.apply && !options.maintenance)
    throw new Error(
      "Apply requires --maintenance after stopping all application writers/schedulers",
    );
  if (options.retireOldActiveIndex && !options.apply)
    throw new Error("Index retirement requires --apply --maintenance");
  return options;
};
export async function provisionIndexes(
  container,
  { apply = false, maintenance = false, retireOldActiveIndex = false } = {},
) {
  if (apply && !maintenance) throw new Error("Stop writers/scheduler and specify maintenance mode");
  const planModel = container.models.MealPlansModel;
  const slotModel = container.models.MealPlanActiveSlotsModel;
  const read = async (session) => {
    const plans = await planModel
      .find({ status: "active" })
      .session(session ?? null)
      .limit(10001)
      .lean();
    const slots = await slotModel
      .find({})
      .session(session ?? null)
      .limit(10001)
      .lean();
    if (plans.length > 10000 || slots.length > 10000)
      throw new Error("Provisioning inventory exceeds safe bound; use a reviewed larger migration");
    return { plans, slots };
  };
  const initial = await read();
  const missing = planActiveSlots(initial.plans, initial.slots);
  const indexes = await planModel.collection
    .listIndexes()
    .toArray()
    .catch((error) => {
      if (error.code === 26) return [];
      throw error;
    });
  const oldIndexPresent = indexes.some((index) => index.name === OLD_INDEX);
  const report = {
    mode: apply ? "apply" : "dry-run",
    activePlans: initial.plans.length,
    missingSlots: missing.length,
    oldIndexPresent,
    builtModels: 0,
    backfilledSlots: 0,
    retiredOldIndex: false,
  };
  if (!apply) return report;
  // Index DDL is deliberately outside transactions. Never use syncIndexes or drop unrelated indexes.
  for (const model of new Set(Object.values(container.models))) {
    await model.createCollection();
    await model.createIndexes();
    report.builtModels++;
  }
  await container.transaction(async (session) => {
    const current = await read(session);
    if (snapshot(current.plans) !== snapshot(initial.plans))
      throw new Error("Active plans changed during maintenance; retry inventory");
    const backfill = planActiveSlots(current.plans, current.slots);
    for (const plan of backfill) {
      const result = await slotModel.updateOne(
        { userId: plan.userId, weekStartDate: plan.weekStartDate, activePlanId: null },
        { $set: { activePlanId: plan._id }, $inc: { version: 1 } },
        { upsert: true, session, runValidators: true },
      );
      if (result.modifiedCount + result.upsertedCount !== 1)
        throw new Error("Slot changed concurrently");
    }
    report.backfilledSlots = backfill.length;
  });
  const verified = await read();
  if (
    planActiveSlots(verified.plans, verified.slots).length ||
    snapshot(verified.plans) !== snapshot(initial.plans)
  )
    throw new Error("Slot verification failed; old index preserved");
  if (oldIndexPresent && retireOldActiveIndex) {
    await planModel.collection.dropIndex(OLD_INDEX);
    report.retiredOldIndex = true;
  }
  return report;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseProvisionArgs(args);
  if (options.help) {
    process.stdout.write(
      "provision-indexes [--dry-run | --apply --maintenance] [--retire-old-active-index]\nStop writers and scheduler, back up, and rehearse on staging before apply. Default is read-only.\n",
    );
    return;
  }
  const env = loadEnv();
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
    await connectDatabase({ ...env.database, autoIndex: false, logger });
    logger.info(
      { report: await provisionIndexes(container, options) },
      "Index provisioning complete",
    );
  } finally {
    await disconnectDatabase();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    process.stderr.write(
      "Index provisioning failed; resolve configuration or inventory conflicts before retrying\n",
    );
    process.exitCode = 1;
  });
