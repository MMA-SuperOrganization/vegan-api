import { randomBytes } from "node:crypto";
export const objectId = () => randomBytes(12).toString("hex");
const clone = (v) => (v === undefined ? undefined : structuredClone(v));
const eq = (a, b) =>
  a instanceof Date || b instanceof Date
    ? new Date(a).getTime() === new Date(b).getTime()
    : b === null
      ? a == null
      : String(a) === String(b);
export function matches(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((v) => matches(record, v));
    if (key === "$and") return expected.every((v) => matches(record, v));
    const value = key.split(".").reduce((r, k) => r?.[k], record);
    if (expected && typeof expected === "object" && !(expected instanceof Date))
      return Object.entries(expected).every(([op, arg]) => {
        if (op === "$in") return arg.some((v) => eq(value, v));
        if (op === "$nin") return !arg.some((v) => eq(value, v));
        if (op === "$ne") return !eq(value, arg);
        if (op === "$exists") return (value !== undefined) === arg;
        if (op === "$lte") return value != null && value <= arg;
        if (op === "$lt") return value != null && value < arg;
        if (op === "$gt") return value != null && value > arg;
        if (op === "$gte") return value != null && value >= arg;
        return false;
      });
    return eq(value, expected);
  });
}
export function fakeRepository(seed = [], clock = () => new Date()) {
  const records = seed.map((v) => ({
    _id: objectId(),
    createdAt: clock(),
    updatedAt: clock(),
    ...clone(v),
  }));
  const sorted = (values, sort = {}) =>
    values.sort((a, b) => {
      for (const [key, direction] of Object.entries(sort)) {
        if (a[key] < b[key]) return -direction;
        if (a[key] > b[key]) return direction;
      }
      return 0;
    });
  return {
    records,
    async findOne(filter) {
      return clone(records.find((v) => matches(v, filter)) ?? null);
    },
    async findById(id) {
      return clone(records.find((v) => eq(v._id, id)) ?? null);
    },
    async findMany(filter = {}, { page = 1, limit = 20, sort } = {}) {
      const all = sorted(
        records.filter((v) => matches(v, filter)),
        sort,
      );
      return {
        data: clone(all.slice((page - 1) * limit, page * limit)),
        meta: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
      };
    },
    async create(value) {
      const record = { _id: objectId(), createdAt: clock(), updatedAt: clock(), ...clone(value) };
      records.push(record);
      return clone(record);
    },
    async updateOne(filter, update, { upsert, sort } = {}) {
      let record = sorted(
        records.filter((v) => matches(v, filter)),
        sort,
      )[0];
      let inserted = false;
      if (!record && upsert) {
        inserted = true;
        record = {
          _id: objectId(),
          createdAt: clock(),
          ...Object.fromEntries(
            Object.entries(filter).filter(
              ([k, v]) => !k.startsWith("$") && (typeof v !== "object" || v instanceof Date),
            ),
          ),
        };
        records.push(record);
      }
      if (!record) return null;
      if (inserted) Object.assign(record, clone(update.$setOnInsert || {}));
      Object.assign(record, clone(update.$set || {}), { updatedAt: clock() });
      for (const [key, value] of Object.entries(update.$inc || {}))
        record[key] = (record[key] || 0) + value;
      for (const key of Object.keys(update.$unset || {})) delete record[key];
      return clone(record);
    },
    async deleteOne(filter) {
      const i = records.findIndex((v) => matches(v, filter));
      return i < 0 ? null : clone(records.splice(i, 1)[0]);
    },
    async count(filter = {}) {
      return records.filter((v) => matches(v, filter)).length;
    },
    async aggregate() {
      return [];
    },
  };
}
export function fakeTransaction(repositories) {
  let queue = Promise.resolve();
  return (work) => {
    const run = queue.then(async () => {
      const snapshots = Object.values(repositories)
        .filter((r) => r.records)
        .map((r) => [r, clone(r.records)]);
      try {
        return await work({ fake: true });
      } catch (e) {
        for (const [r, records] of snapshots) r.records.splice(0, r.records.length, ...records);
        throw e;
      }
    });
    queue = run.catch(() => {});
    return run;
  };
}
