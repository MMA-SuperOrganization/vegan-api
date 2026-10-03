import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { AppError } from "../../common/errors/app-error.js";
import { weightInput } from "./weight-logs.validation.js";
dayjs.extend(utc);
dayjs.extend(timezone);
export const logOwner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
export const aggregateOwner = (id) =>
  mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : id;
export function logRange(query = {}, now = new Date()) {
  const zone = query.timezone ?? "UTC";
  const today = dayjs(now).tz(zone).format("YYYY-MM-DD");
  const to = query.date ?? query.to ?? today;
  const from = query.date ?? query.from ?? dayjs.utc(to).subtract(29, "day").format("YYYY-MM-DD");
  if (from > to || new Date(to) - new Date(from) > 366 * 86400000)
    throw AppError.badRequest("Range must be ordered and at most 366 days");
  const nextDay = dayjs.utc(to).add(1, "day").format("YYYY-MM-DD");
  return {
    from,
    to,
    timezone: zone,
    recordedAt: {
      $gte: dayjs.tz(`${from}T00:00:00`, zone).toDate(),
      $lt: dayjs.tz(`${nextDay}T00:00:00`, zone).toDate(),
    },
  };
}
export function createWeightLogsService({ weightLogsRepository: repo, clock = () => new Date() }) {
  const now = () => new Date(typeof clock === "function" ? clock() : clock.now());
  async function getOwned(userId, id, options = {}) {
    const log = await repo.findOne({ _id: id, userId }, options);
    if (!log) throw AppError.notFound("Weight log not found");
    return log;
  }
  async function createForUser(userId, input, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const body = weightInput.parse(input);
    return repo.create(
      {
        ...body,
        userId,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : now(),
        version: 0,
      },
      options,
    );
  }
  const operations = {
    getWeightLogs: async ({ actor, query = {} }) =>
      repo.findMany(
        { userId: logOwner(actor), recordedAt: logRange(query, now()).recordedAt },
        { page: query.page, limit: query.limit, sort: { recordedAt: -1, _id: -1 } },
      ),
    createWeightLog: async ({ actor, body }) => createForUser(logOwner(actor), body),
    updateWeightLog: async ({ actor, params, body }) => {
      const userId = logOwner(actor);
      const log = await getOwned(userId, params.id);
      const updated = await repo.updateOne(
        {
          _id: params.id,
          userId,
          version: log.version === undefined ? { $exists: false } : log.version,
        },
        {
          $set: { ...body, ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}) },
          $inc: { version: 1 },
        },
      );
      if (!updated) throw AppError.conflict("Weight log changed concurrently");
      return updated;
    },
    deleteWeightLog: async ({ actor, params }) => {
      const log = await repo.deleteOne({ _id: params.id, userId: logOwner(actor) });
      if (!log) throw AppError.notFound("Weight log not found");
      return { id: String(log._id), deleted: true };
    },
    getWeightTrend: async ({ actor, query = {} }) => {
      const userId = logOwner(actor);
      const { from, to, timezone, recordedAt } = logRange(query, now());
      const days = await repo.aggregate([
        { $match: { userId: aggregateOwner(userId), recordedAt } },
        { $sort: { recordedAt: 1, _id: 1 } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt", timezone } },
            count: { $sum: 1 },
            averageWeightKg: { $avg: "$weightKg" },
            firstWeightKg: { $first: "$weightKg" },
            latestWeightKg: { $last: "$weightKg" },
            firstRecordedAt: { $first: "$recordedAt" },
            latestRecordedAt: { $last: "$recordedAt" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const points = days.map(({ _id, ...day }) => ({ date: _id, ...day }));
      const first = points[0];
      const last = points.at(-1);
      const changeKg = first ? last.latestWeightKg - first.firstWeightKg : null;
      const elapsedDays = first
        ? (new Date(last.latestRecordedAt) - new Date(first.firstRecordedAt)) / 86400000
        : 0;
      return {
        from,
        to,
        timezone,
        points,
        count: points.reduce((sum, point) => sum + point.count, 0),
        startWeightKg: first?.firstWeightKg ?? null,
        endWeightKg: last?.latestWeightKg ?? null,
        changeKg,
        changePercent: first ? (changeKg / first.firstWeightKg) * 100 : null,
        averageChangeKgPerDay: elapsedDays > 0 ? changeKg / elapsedDays : null,
      };
    },
  };
  return {
    operations,
    publicService: {
      createForUser,
      getTrend: async (userId, query) => operations.getWeightTrend({ actor: { userId }, query }),
    },
  };
}
