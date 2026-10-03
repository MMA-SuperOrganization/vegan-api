import { randomBytes } from "node:crypto";
export const newId = () => randomBytes(12).toString("hex");
const clone = (value) => (value === undefined ? undefined : structuredClone(value));
const field = (record, path) => path.split(".").reduce((value, key) => value?.[key], record);
const eq = (a, b) =>
  a instanceof Date || b instanceof Date
    ? new Date(a).getTime() === new Date(b).getTime()
    : String(a) === String(b);
export function matches(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const value = field(record, key);
    if (key === "$or") return expected.some((filter) => matches(record, filter));
    if (
      expected &&
      typeof expected === "object" &&
      !(expected instanceof Date) &&
      !expected._bsontype
    )
      return Object.entries(expected).every(([op, argument]) => {
        if (op === "$exists") return (value !== undefined) === argument;
        if (op === "$gte") return value >= argument;
        if (op === "$gt") return value > argument;
        if (op === "$lte") return value <= argument;
        if (op === "$lt") return value < argument;
        if (op === "$ne") return !eq(value, argument);
        if (op === "$in") return argument.some((v) => eq(value, v));
        throw new Error(`Unsupported fake filter ${op}`);
      });
    return eq(value, expected);
  });
}
const sort = (rows, keys = {}) =>
  rows.sort((a, b) => {
    for (const [key, direction] of Object.entries(keys)) {
      if (a[key] < b[key]) return -direction;
      if (a[key] > b[key]) return direction;
    }
    return 0;
  });
function evaluate(record, expression) {
  if (typeof expression === "string" && expression.startsWith("$"))
    return field(record, expression.slice(1));
  if (expression?.$dateToString) {
    const { date, timezone = "UTC" } = expression.$dateToString;
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(new Date(evaluate(record, date)))
        .map((part) => [part.type, part.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  return expression;
}
export function repository(seed = []) {
  const records = seed.map((record) => ({ _id: newId(), ...clone(record) }));
  const calls = [];
  return {
    records,
    calls,
    async findOne(filter, options) {
      calls.push({ method: "findOne", filter, options });
      return clone(records.find((row) => matches(row, filter)) ?? null);
    },
    async findMany(filter, { page = 1, limit = 20, sort: order } = {}) {
      calls.push({ method: "findMany", filter });
      const rows = sort(
        records.filter((row) => matches(row, filter)),
        order,
      );
      return {
        data: clone(rows.slice((page - 1) * limit, page * limit)),
        meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
      };
    },
    async create(data, options) {
      calls.push({ method: "create", options });
      const row = { _id: newId(), ...clone(data) };
      records.push(row);
      return clone(row);
    },
    async updateOne(filter, update, options = {}) {
      calls.push({ method: "updateOne", filter, update, options });
      let row = records.find((row) => matches(row, filter));
      if (!row && options.upsert) {
        row = { _id: newId(), ...filter, ...clone(update.$setOnInsert) };
        records.push(row);
      }
      if (!row) return null;
      Object.assign(row, clone(update.$set));
      for (const [key, amount] of Object.entries(update.$inc ?? {}))
        row[key] = (row[key] ?? 0) + amount;
      return clone(row);
    },
    async deleteOne(filter) {
      calls.push({ method: "deleteOne", filter });
      const index = records.findIndex((row) => matches(row, filter));
      return index < 0 ? null : clone(records.splice(index, 1)[0]);
    },
    async aggregate(pipeline, options) {
      calls.push({ method: "aggregate", pipeline, options });
      let rows = records;
      for (const stage of pipeline) {
        if (stage.$match) rows = rows.filter((row) => matches(row, stage.$match));
        else if (stage.$sort) rows = sort([...rows], stage.$sort);
        else if (stage.$group) {
          const groups = new Map();
          for (const row of rows) {
            const key = evaluate(row, stage.$group._id);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
          }
          rows = [...groups].map(([key, values]) => {
            const output = { _id: key };
            for (const [name, expression] of Object.entries(stage.$group)) {
              if (name === "_id") continue;
              const [operator, argument] = Object.entries(expression)[0];
              const data = values.map((row) => evaluate(row, argument));
              if (operator === "$sum")
                output[name] = data.reduce((sum, value) => sum + (value ?? 0), 0);
              else if (operator === "$avg")
                output[name] = data.reduce((sum, value) => sum + value, 0) / data.length;
              else if (operator === "$first") output[name] = data[0];
              else if (operator === "$last") output[name] = data.at(-1);
              else throw new Error(`Unsupported aggregate ${operator}`);
            }
            return output;
          });
        } else throw new Error("Unsupported aggregate stage");
      }
      return clone(rows);
    },
  };
}
export function transaction(repos) {
  let queue = Promise.resolve();
  return (work) => {
    const result = queue.then(async () => {
      const snapshots = repos.map((repo) => clone(repo.records));
      try {
        return await work({ fakeSession: true });
      } catch (error) {
        repos.forEach((repo, i) => repo.records.splice(0, repo.records.length, ...snapshots[i]));
        throw error;
      }
    });
    queue = result.catch(() => {});
    return result;
  };
}
