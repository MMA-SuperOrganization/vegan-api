import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { AppError } from "../../common/errors/app-error.js";
import { waterInput } from "./water-logs.validation.js";
dayjs.extend(utc);
dayjs.extend(timezone);
const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};
const mongoId = (id) =>
  mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : id;
function range(query, now) {
  const zone = query.timezone ?? "UTC";
  const to = query.date ?? query.to ?? dayjs(now).tz(zone).format("YYYY-MM-DD");
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
export function createWaterLogsService({ waterLogsRepository: repo, clock = () => new Date() }) {
  const now = () => new Date(typeof clock === "function" ? clock() : clock.now());
  async function createForUser(userId, input, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const body = waterInput.parse(input);
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
  async function getTotals(userId, query = {}, options = {}) {
    if (!userId) throw AppError.unauthorized();
    const { from, to, timezone, recordedAt } = range(query, now());
    const rows = await repo.aggregate(
      [
        { $match: { userId: mongoId(userId), recordedAt } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt", timezone } },
            amountMl: { $sum: "$amountMl" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ],
      options,
    );
    const days = rows.map(({ _id, ...day }) => ({ date: _id, ...day }));
    return {
      from,
      to,
      timezone,
      days,
      totalMl: days.reduce((sum, day) => sum + day.amountMl, 0),
      count: days.reduce((sum, day) => sum + day.count, 0),
    };
  }
  const operations = {
    getWaterLogs: async ({ actor, query = {} }) => {
      const userId = owner(actor);
      const recordedAt = range(query, now()).recordedAt;
      const [result, totals] = await Promise.all([
        repo.findMany(
          { userId, recordedAt },
          { page: query.page, limit: query.limit, sort: { recordedAt: -1, _id: -1 } },
        ),
        getTotals(userId, query),
      ]);
      return { data: result.data, meta: { ...result.meta, ...totals } };
    },
    createWaterLog: async ({ actor, body }) => createForUser(owner(actor), body),
    updateWaterLog: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const log = await repo.findOne({ _id: params.id, userId });
      if (!log) throw AppError.notFound("Water log not found");
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
      if (!updated) throw AppError.conflict("Water log changed concurrently");
      return updated;
    },
    deleteWaterLog: async ({ actor, params }) => {
      const log = await repo.deleteOne({ _id: params.id, userId: owner(actor) });
      if (!log) throw AppError.notFound("Water log not found");
      return { id: String(log._id), deleted: true };
    },
  };
  return { operations, publicService: { createForUser, getTotals } };
}
