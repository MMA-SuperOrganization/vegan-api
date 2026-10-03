import { z } from "zod";
import {
  admin,
  id,
  text,
  integer,
  rangeSchema,
  range,
  repository,
  service,
  summarizeContent,
} from "../app-config/index.js";
const type = z.enum(["all", "recipe", "post", "video"]);
const trendsQuery = rangeSchema({ interval: z.enum(["day", "week", "month"]).default("day") });
export const dashboardValidation = {
  getDashboardSummary: { query: rangeSchema() },
  getContentTrends: { query: trendsQuery },
  getUserTrends: { query: trendsQuery },
  getPendingContent: {
    query: rangeSchema({
      page: integer(20, 1),
      limit: integer(50, 20),
      type: type.default("all"),
      q: text(120).optional(),
      authorId: id.optional(),
    }),
  },
};
const keys = { recipe: "recipes", post: "posts", video: "videos" };
const buckets = (deps, query, field, category) => [
  { $match: { [field]: range(deps, query).filter, ...category.filter } },
  {
    $group: {
      _id: { $dateTrunc: { date: `$${field}`, unit: query.interval ?? "day", timezone: "UTC" } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, bucket: "$_id", count: 1 } },
];
export const createAdminDashboardService = (deps) => ({
  async getDashboardSummary({ actor, query = {} }) {
    admin(actor);
    const selectedRange = range(deps, query);
    const [users, content, reports, ai] = await Promise.all([
      Promise.all([
        repository(deps, "users").count({ deletedAt: null }),
        repository(deps, "users").count({ deletedAt: null, status: "active" }),
        repository(deps, "users").count({ deletedAt: null, status: "suspended" }),
        repository(deps, "users").count({ createdAt: selectedRange.filter, deletedAt: null }),
      ]).then(([total, active, suspended, newInRange]) => ({
        total,
        active,
        suspended,
        newInRange,
      })),
      Promise.all(
        Object.entries(keys).map(async ([type, key]) => {
          const repo = repository(deps, key);
          const [published, pending, hidden] = await Promise.all([
            repo.count({
              status: "published",
              visibility: "public",
              deletedAt: null,
              publishedAt: selectedRange.filter,
            }),
            repo.count({ status: "pending_review", deletedAt: null }),
            repo.count({ status: "hidden", deletedAt: null }),
          ]);
          return [type, { publishedInRange: published, pending, hidden }];
        }),
      ).then(Object.fromEntries),
      Promise.all(
        ["open", "reviewing", "resolved", "dismissed"].map(async (status) => [
          status,
          await repository(deps, "reports").count({ status, createdAt: selectedRange.filter }),
        ]),
      ).then(Object.fromEntries),
      service(deps, "aiMonitoring", "metrics")({ actor, query }),
    ]);
    return {
      range: { from: selectedRange.from, to: selectedRange.to },
      users,
      content,
      reports,
      ai,
      definitions: {
        pendingAndHidden: "Current content inventory",
        activeAndSuspendedUsers: "Current account states",
        rangeCounts: "New users/reports and publications in selected range",
      },
    };
  },
  async getContentTrends({ actor, query = {} }) {
    admin(actor);
    const selectedRange = range(deps, query);
    const data = await Promise.all(
      Object.entries(keys).map(async ([type, key]) => {
        const published = await repository(deps, key).aggregate(
          buckets(deps, query, "publishedAt", { filter: { deletedAt: null } }),
        );
        const flagged = await repository(deps, "reports").aggregate(
          buckets(deps, query, "createdAt", { filter: { targetType: type } }),
        );
        return { type, published, flagged };
      }),
    );
    return {
      range: { from: selectedRange.from, to: selectedRange.to },
      interval: query.interval ?? "day",
      timezone: "UTC",
      series: data,
      definitions: {
        flagged: "Report submissions (not unique targets)",
        published: "Publication timestamps on current nondeleted content",
      },
    };
  },
  async getUserTrends({ actor, query = {} }) {
    admin(actor);
    const selectedRange = range(deps, query);
    const [newUsers, activeUsers, suspendedUsers] = await Promise.all([
      repository(deps, "users").aggregate(
        buckets(deps, query, "createdAt", { filter: { deletedAt: null } }),
      ),
      repository(deps, "users").aggregate(
        buckets(deps, query, "lastLoginAt", { filter: { deletedAt: null, status: "active" } }),
      ),
      repository(deps, "auditLogs").aggregate([
        {
          $match: {
            createdAt: selectedRange.filter,
            action: { $in: ["user.suspend", "users.suspend", "suspendUser"] },
            targetType: "user",
          },
        },
        {
          $group: {
            _id: {
              bucket: {
                $dateTrunc: { date: "$createdAt", unit: query.interval ?? "day", timezone: "UTC" },
              },
              targetId: "$targetId",
            },
          },
        },
        { $group: { _id: "$_id.bucket", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, bucket: "$_id", count: 1 } },
      ]),
    ]);
    return {
      range: { from: selectedRange.from, to: selectedRange.to },
      interval: query.interval ?? "day",
      timezone: "UTC",
      series: { newUsers, activeUsers, suspendedUsers },
      definitions: {
        activeUsers: "Currently active users grouped by most recent login; not DAU",
        suspendedUsers: "Distinct suspension targets per bucket from audit events",
      },
    };
  },
  async getPendingContent({ actor, query = {} }) {
    admin(actor);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const selectedRange = range(deps, query);
    const types = query.type && query.type !== "all" ? [query.type] : Object.keys(keys);
    const results = await Promise.all(
      types.map(async (type) => {
        const filter = {
          status: "pending_review",
          deletedAt: null,
          createdAt: selectedRange.filter,
        };
        if (query.authorId) filter.authorId = query.authorId;
        if (query.q)
          filter.title = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        const result = await repository(deps, keys[type]).findMany(filter, {
          page: 1,
          limit: page * limit,
          sort: { createdAt: 1, _id: 1 },
        });
        return {
          data: result.data.map((item) => ({
            ...summarizeContent(item),
            type,
            status: item.status,
          })),
          total: result.meta.total,
        };
      }),
    );
    const items = results
      .flatMap((result) => result.data)
      .sort(
        (a, b) =>
          new Date(a.createdAt) - new Date(b.createdAt) ||
          String(a._id).localeCompare(String(b._id)),
      );
    const total = results.reduce((sum, result) => sum + result.total, 0);
    return {
      data: items.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
});
