import { randomBytes } from "node:crypto";

export const newId = () => randomBytes(12).toString("hex");
const clone = (value) => {
  if (value == null || typeof value !== "object") return value;
  if (value.toHexString) return value.toHexString();
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value);
  if (Array.isArray(value)) return value.map(clone);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
};
const scalar = (value) =>
  value instanceof Date ? value.getTime() : value?.toHexString ? value.toHexString() : value;
const equal = (a, b) => scalar(a) === scalar(b) || (a == null && b == null);
const at = (value, path) =>
  path
    .split(".")
    .reduce(
      (current, key) =>
        Array.isArray(current) ? current.flatMap((item) => item?.[key]) : current?.[key],
      value,
    );
export const matches = (record, filter = {}) =>
  Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((part) => matches(record, part));
    if (key === "$and") return expected.every((part) => matches(record, part));
    if (key === "$nor") return !expected.some((part) => matches(record, part));
    const actual = at(record, key);
    if (expected instanceof RegExp) return expected.test(String(actual ?? ""));
    if (
      expected &&
      typeof expected === "object" &&
      !(expected instanceof Date) &&
      !expected.toHexString
    ) {
      return Object.entries(expected).every(([op, value]) => {
        const values = Array.isArray(actual) ? actual : [actual];
        if (op === "$in") return values.some((v) => value.some((e) => equal(v, e)));
        if (op === "$nin") return !values.some((v) => value.some((e) => equal(v, e)));
        if (op === "$ne") return !values.some((v) => equal(v, value));
        if (op === "$eq") return values.some((v) => equal(v, value));
        if (op === "$exists") return (actual !== undefined) === value;
        if (op === "$gt") return scalar(actual) > scalar(value);
        if (op === "$gte") return scalar(actual) >= scalar(value);
        if (op === "$lt") return scalar(actual) < scalar(value);
        if (op === "$lte") return scalar(actual) <= scalar(value);
        if (op === "$regex")
          return new RegExp(value, expected.$options ?? "").test(String(actual ?? ""));
        if (op === "$options") return true;
        if (op === "$elemMatch") return (actual ?? []).some((v) => matches(v, value));
        if (op === "$size") return actual?.length === value;
        throw new Error(`Unsupported memory filter: ${op}`);
      });
    }
    return Array.isArray(actual) ? actual.some((v) => equal(v, expected)) : equal(actual, expected);
  });
const set = (record, path, value) => {
  const keys = path.split(".");
  const leaf = keys.pop();
  let cursor = record;
  for (const key of keys) cursor = cursor[key] ??= {};
  cursor[leaf] = clone(value);
};
const project = (record, projection) => {
  if (!record || !projection) return clone(record);
  // Mongoose +field restores a select:false field without making an inclusive projection.
  const fields =
    typeof projection === "string"
      ? Object.fromEntries(
          projection
            .split(" ")
            .filter((key) => key && !key.startsWith("+"))
            .map((key) => [key.replace(/^-/, ""), key.startsWith("-") ? 0 : 1]),
        )
      : projection;
  const positive = Object.entries(fields).filter(([, flag]) => flag === 1);
  const result = positive.length ? { _id: record._id } : clone(record);
  for (const [key] of positive)
    if (at(record, key) !== undefined) set(result, key, at(record, key));
  for (const [key, flag] of Object.entries(fields)) if (flag === 0) delete result[key];
  return result;
};
const sortRecords = (rows, sort) => {
  const fields =
    typeof sort === "string"
      ? Object.fromEntries(
          sort.split(" ").map((k) => [k.replace(/^-/, ""), k.startsWith("-") ? -1 : 1]),
        )
      : (sort ?? { createdAt: -1 });
  return rows.sort((a, b) => {
    for (const [key, direction] of Object.entries(fields)) {
      const x = scalar(at(a, key)),
        y = scalar(at(b, key));
      if (x < y) return -direction;
      if (x > y) return direction;
    }
    return 0;
  });
};
const UNIQUE = {
  users: [["firebaseUid"]],
  userProfiles: [["userId"]],
  nutritionProfiles: [["userId"]],
  pantries: [["userId"]],
  notificationPreferences: [["userId"]],
  categories: [["slug"]],
  allergens: [["slug"]],
  foodItems: [["slug"]],
  recipes: [["slug"]],
  videos: [["slug"]],
  mediaAssets: [["objectKey"]],
  reactions: [["userId", "targetType", "targetId"]],
  savedItems: [["userId", "targetType", "targetId"]],
  ratings: [["userId", "targetType", "targetId"]],
  viewHistories: [["userId", "targetType", "targetId"]],
  aiFeedback: [["userId", "aiRunId"]],
  notifications: [["deliveryKey"]],
  adminGuards: [["key"]],
  mealPlanActiveSlots: [["userId", "weekStartDate"]],
};
const VERSIONED = new Set([
  "adminGuards",
  "nutritionProfiles",
  "recipes",
  "posts",
  "videos",
  "mediaAssets",
  "comments",
  "reactions",
  "ratings",
  "viewHistories",
  "pantries",
  "mealPlans",
  "mealPlanActiveSlots",
  "groceryLists",
  "diaryEntries",
  "weightLogs",
  "waterLogs",
  "reminders",
  "reports",
  "moderation",
]);
export const createMemoryRepository = (key, seed = []) => {
  const records = new Map(
    seed.map((row) => {
      const value = {
        _id: newId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(VERSIONED.has(key) ? { version: 0 } : {}),
        ...clone(row),
      };
      return [String(value._id), value];
    }),
  );
  const check = (record) => {
    for (const fields of UNIQUE[key] ?? []) {
      if (fields.some((field) => record[field] == null)) continue;
      if (
        [...records.values()].some(
          (other) =>
            other._id !== record._id && fields.every((field) => equal(other[field], record[field])),
        )
      )
        throw Object.assign(new Error("Duplicate"), {
          code: 11000,
          keyPattern: Object.fromEntries(fields.map((f) => [f, 1])),
        });
    }
  };
  const find = (filter, options = {}) =>
    sortRecords(
      [...records.values()].filter((record) => matches(record, filter)),
      options.sort,
    );
  const repository = {
    records,
    async findOne(filter, options = {}) {
      return project(find(filter, options)[0] ?? null, options.projection);
    },
    async findById(id, options = {}) {
      const row = records.get(String(id));
      return row ? project(row, options.projection) : null;
    },
    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20 } = options;
      const rows = find(filter, options);
      return {
        data: rows
          .slice((page - 1) * limit, page * limit)
          .map((r) => project(r, options.projection)),
        meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
      };
    },
    async create(data) {
      const row = {
        _id: newId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(VERSIONED.has(key) ? { version: 0 } : {}),
        ...clone(data),
      };
      check(row);
      records.set(String(row._id), row);
      return clone(row);
    },
    async updateOne(filter, update, options = {}) {
      let row = find(filter, options)[0];
      let inserted = false;
      if (!row && options.upsert) {
        row = {
          _id: newId(),
          createdAt: new Date(),
          ...(VERSIONED.has(key) ? { version: 0 } : {}),
          ...Object.fromEntries(
            Object.entries(filter).filter(
              ([k, v]) => !k.startsWith("$") && (v == null || typeof v !== "object"),
            ),
          ),
        };
        inserted = true;
      }
      if (!row) return null;
      row = clone(row);
      for (const [op, values] of Object.entries(update)) {
        if (op === "$set" || (op === "$setOnInsert" && inserted)) {
          for (const [path, value] of Object.entries(values)) set(row, path, value);
        } else if (op === "$setOnInsert") continue;
        else if (op === "$inc") {
          for (const [path, value] of Object.entries(values))
            set(row, path, (at(row, path) ?? 0) + value);
        } else if (op === "$unset") {
          for (const path of Object.keys(values)) delete row[path];
        } else if (op === "$push" || op === "$addToSet") {
          for (const [path, value] of Object.entries(values)) {
            const items = value?.$each ?? [value];
            const existing = at(row, path) ?? [];
            set(
              row,
              path,
              op === "$push"
                ? [...existing, ...items]
                : [
                    ...existing,
                    ...items.filter(
                      (item) => !existing.some((v) => JSON.stringify(v) === JSON.stringify(item)),
                    ),
                  ],
            );
          }
        } else if (op === "$pull") {
          for (const [path, value] of Object.entries(values))
            set(
              row,
              path,
              (at(row, path) ?? []).filter((item) =>
                typeof value === "object" ? !matches(item, value) : !equal(item, value),
              ),
            );
        } else throw new Error(`Unsupported memory update: ${op}`);
      }
      row.updatedAt = new Date();
      check(row);
      records.set(String(row._id), row);
      return clone(row);
    },
    async deleteOne(filter) {
      const row = find(filter)[0];
      if (!row) return null;
      records.delete(String(row._id));
      return clone(row);
    },
    async count(filter = {}) {
      return find(filter).length;
    },
    async aggregate(pipeline) {
      let rows = clone([...records.values()]);
      for (const stage of pipeline) {
        if (stage.$match) rows = rows.filter((row) => matches(row, stage.$match));
        else if (stage.$sort) rows = sortRecords(rows, stage.$sort);
        else if (stage.$limit) rows = rows.slice(0, stage.$limit);
        else if (stage.$count) rows = rows.length ? [{ [stage.$count]: rows.length }] : [];
        else if (stage.$group) {
          const groups = new Map();
          const expr = (row, value) => {
            if (typeof value === "string" && value.startsWith("$")) return at(row, value.slice(1));
            if (value?.$dateToString) {
              const { date, timezone = "UTC", format } = value.$dateToString;
              if (format !== "%Y-%m-%d") throw new Error(`Unsupported date format ${format}`);
              const parts = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).formatToParts(new Date(expr(row, date)));
              const field = (name) => parts.find((part) => part.type === name).value;
              return `${field("year")}-${field("month")}-${field("day")}`;
            }
            return value;
          };
          for (const row of rows) {
            const groupId = expr(row, stage.$group._id);
            const k = JSON.stringify(groupId);
            if (!groups.has(k)) groups.set(k, { _id: groupId, rows: [] });
            groups.get(k).rows.push(row);
          }
          rows = [...groups.values()].map((group) => {
            const result = { _id: group._id };
            for (const [field, acc] of Object.entries(stage.$group)) {
              if (field === "_id") continue;
              const [op, expression] = Object.entries(acc)[0];
              const values = group.rows.map((r) => expr(r, expression));
              if (op === "$sum") result[field] = values.reduce((s, v) => s + (v ?? 0), 0);
              else if (op === "$avg")
                result[field] = values.reduce((s, v) => s + (v ?? 0), 0) / values.length;
              else if (op === "$max")
                result[field] = values.reduce((a, b) => (scalar(a) > scalar(b) ? a : b));
              else if (op === "$min")
                result[field] = values.reduce((a, b) => (scalar(a) < scalar(b) ? a : b));
              else if (op === "$first") result[field] = values[0];
              else if (op === "$last") result[field] = values.at(-1);
              else throw new Error(`Unsupported accumulator ${op}`);
            }
            return result;
          });
        } else throw new Error(`Unsupported memory aggregate ${Object.keys(stage)[0]}`);
      }
      return rows;
    },
  };
  return repository;
};
export const REPOSITORY_KEYS = [
  "users",
  "userProfiles",
  "nutritionProfiles",
  "adminGuards",
  "categories",
  "allergens",
  "foodItems",
  "mediaAssets",
  "recipes",
  "posts",
  "videos",
  "comments",
  "reactions",
  "ratings",
  "savedItems",
  "viewHistories",
  "pantries",
  "mealPlans",
  "mealPlanActiveSlots",
  "groceryLists",
  "diaryEntries",
  "weightLogs",
  "waterLogs",
  "aiConversations",
  "aiMessages",
  "aiRuns",
  "aiFeedback",
  "aiProposals",
  "notifications",
  "notificationPreferences",
  "reminders",
  "searchHistory",
  "reports",
  "moderation",
  "auditLogs",
];
export const createMemoryRepositories = (seed = {}) =>
  Object.fromEntries(REPOSITORY_KEYS.map((key) => [key, createMemoryRepository(key, seed[key])]));
export const memoryTransaction = (repositories) => {
  let queue = Promise.resolve();
  return (work) => {
    const execute = async () => {
      const snapshots = Object.fromEntries(
        Object.entries(repositories).map(([key, repo]) => [key, clone([...repo.records])]),
      );
      try {
        return await work({ inMemory: true });
      } catch (error) {
        for (const [key, rows] of Object.entries(snapshots)) {
          repositories[key].records.clear();
          for (const [id, row] of rows) repositories[key].records.set(id, row);
        }
        throw error;
      }
    };
    const result = queue.then(execute, execute);
    queue = result.catch(() => {});
    return result;
  };
};
