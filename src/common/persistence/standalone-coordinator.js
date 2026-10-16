import { AsyncLocalStorage } from "node:async_hooks";
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";

const GUARD_COLLECTION = "_standalone_operation";
const GUARD_ID = "exclusive";
const recoveryRequired = () =>
  AppError.serviceUnavailable(
    "An unfinished database operation requires maintenance recovery",
    "STANDALONE_RECOVERY_REQUIRED",
  );
const assertActive = (state) => {
  if (!state.active)
    throw AppError.serviceUnavailable(
      "Database coordination scope has closed",
      "COORDINATION_CLOSED",
    );
};
const drainWrites = async (state) => {
  state.active = false;
  return Promise.allSettled([...state.pending]);
};

const mutationSnapshot = async (model, kind, args) => {
  const [filterOrData, update] = args;
  const options = (kind === "deleteOne" ? args[1] : args[2]) ?? {};
  let before, id;
  if (kind === "create") {
    id = model.findOne({ _id: filterOrData._id ?? new mongoose.Types.ObjectId() }).cast(model)._id;
    args[0] = { ...filterOrData, _id: id };
    before = await model.collection.findOne({ _id: id });
  } else {
    // Compensation must include select:false and legacy fields. A Mongoose lean
    // query still applies schema projections and can silently lose private data.
    const filter = model.findOne(filterOrData).cast(model);
    before = await model.collection.findOne(filter, {
      sort: options.sort,
      collation: options.collation,
    });
    id = before?._id;
    if (before) args[0] = { ...filterOrData, _id: id };
    else if (kind === "updateOne" && options.upsert) {
      id =
        filter._id instanceof mongoose.Types.ObjectId ? filter._id : new mongoose.Types.ObjectId();
      args[1] = { ...update, $setOnInsert: { ...update.$setOnInsert, _id: id } };
    }
  }
  return id ? { collection: model.collection.name, id, before: before ?? null } : null;
};

// Redis serializes contenders. A non-expiring Mongo guard prevents a stale worker
// from overlapping a new worker after a Redis restart, eviction or lease expiry.
// Never steal this guard automatically: crash recovery requires quiescent writers.
export const createStandaloneCoordinator = ({ connection, redis }) => {
  const context = new AsyncLocalStorage();
  const guards = () => connection.db.collection(GUARD_COLLECTION);
  const run = async (work) => {
    const existing = context.getStore();
    if (existing) {
      assertActive(existing);
      return work();
    }
    const lease = await redis.acquire();
    try {
      try {
        await guards().insertOne(
          {
            _id: GUARD_ID,
            owner: lease.token,
            startedAt: new Date(),
            state: "running",
            entries: [],
          },
          { writeConcern: { w: 1, j: true } },
        );
      } catch (error) {
        if (error.code === 11000) throw recoveryRequired();
        throw error;
      }
      const state = { lease, entries: [], active: true, pending: new Set(), writeError: null };
      try {
        const result = await context.run(state, work);
        const settled = await drainWrites(state);
        if (state.writeError) throw state.writeError;
        const failed = settled.find((outcome) => outcome.status === "rejected");
        if (failed) throw failed.reason;
        await lease.assertOwned();
        // Committed marker makes recovery distinguish success from interrupted work.
        const commit = await guards().updateOne(
          { _id: GUARD_ID, owner: lease.token },
          { $set: { state: "committed" } },
          { writeConcern: { w: 1, j: true } },
        );
        if (commit.matchedCount !== 1) throw recoveryRequired();
        if (state.entries.length) await redis.invalidate();
        await guards().deleteOne(
          { _id: GUARD_ID, owner: lease.token },
          { writeConcern: { w: 1, j: true } },
        );
        return result;
      } catch (error) {
        // A rejected Promise.all may leave another Mongo write in flight. Drain
        // every started mutation before restoring its preimage or releasing guard.
        await drainWrites(state);
        // Read journal from Mongo: a failed acknowledgement may still have persisted.
        const guard = await guards().findOne({ _id: GUARD_ID, owner: lease.token });
        if (!guard) throw recoveryRequired();
        if (guard.state !== "committed") await restoreStandaloneJournal(connection, guard);
        if (guard.entries.length) await redis.invalidate();
        await guards().deleteOne(
          { _id: GUARD_ID, owner: lease.token },
          { writeConcern: { w: 1, j: true } },
        );
        throw error;
      }
    } finally {
      // A rollback/database failure deliberately retains the durable guard.
      await lease.release();
    }
  };
  return {
    run,
    async mutate(model, kind, args, work) {
      return run(() => {
        const state = context.getStore();
        const operation = (async () => {
          assertActive(state);
          await state.lease.assertOwned();
          const entry = await mutationSnapshot(model, kind, args);
          assertActive(state);
          if (entry) {
            // Persist the inverse before the write; retries of recovery are idempotent.
            const recorded = await guards().updateOne(
              { _id: GUARD_ID, owner: state.lease.token, state: "running" },
              { $push: { entries: entry } },
              { writeConcern: { w: 1, j: true } },
            );
            if (recorded.matchedCount !== 1) throw recoveryRequired();
            state.entries.push(entry);
          }
          await state.lease.assertOwned();
          assertActive(state);
          return work();
        })();
        state.pending.add(operation);
        operation.then(
          () => state.pending.delete(operation),
          (error) => {
            state.writeError ??= error;
            state.pending.delete(operation);
          },
        );
        return operation;
      });
    },
  };
};

export const restoreStandaloneJournal = async (connection, guard) => {
  for (const entry of [...guard.entries].reverse()) {
    const collection = connection.db.collection(entry.collection);
    if (entry.before)
      await collection.replaceOne({ _id: entry.id }, entry.before, {
        upsert: true,
        writeConcern: { w: 1, j: true },
      });
    else await collection.deleteOne({ _id: entry.id }, { writeConcern: { w: 1, j: true } });
  }
};

export const recoverStandaloneOperation = async (connection) => {
  const collection = connection.db.collection(GUARD_COLLECTION);
  const guard = await collection.findOne({ _id: GUARD_ID });
  if (!guard) return false;
  if (guard.state !== "committed") await restoreStandaloneJournal(connection, guard);
  await collection.deleteOne(
    { _id: GUARD_ID, owner: guard.owner },
    { writeConcern: { w: 1, j: true } },
  );
  return true;
};
