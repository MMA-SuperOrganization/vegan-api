import { z } from "zod";
import { unionPage } from "../../common/persistence/union-page.js";
import { contentCardProjection } from "../../common/utils/content-card.js";
import {
  admin,
  id,
  text,
  integer,
  pagination,
  rangeSchema,
  range,
  repository,
  service,
  summarizeContent,
} from "../app-config/index.js";
const pendingType = z.enum(["all", "recipe", "post", "video"]);
const managedStatus = z
  .enum([
    "all",
    "draft",
    "pending_review",
    "published",
    "rejected",
    "archived",
    "hidden",
    "deleted",
  ])
  .optional();
const trendsQuery = rangeSchema({ interval: z.enum(["day", "week", "month"]).default("day") });
export const dashboardValidation = {
  getDashboardSummary: { query: rangeSchema() },
  getContentTrends: { query: trendsQuery },
  getUserTrends: { query: trendsQuery },
  getPendingContent: {
    query: rangeSchema({
      page: pagination.page,
      limit: integer(50, 20),
      type: pendingType.default("all"),
      q: text(120).optional(),
      authorId: id.optional(),
      status: managedStatus,
    }),
  },
};
const keys = { recipe: "recipes", post: "posts", video: "videos" };
const reviewableKeys = { recipe: "recipes", post: "posts", video: "videos" };
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
    const [users, content, reports, engagement, ai] = await Promise.all([
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
            type === "post"
              ? Promise.resolve(0)
              : repo.count({ status: "pending_review", deletedAt: null }),
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
      Promise.all([
        repository(deps, "comments").count({ status: { $ne: "deleted" }, deletedAt: null }),
        repository(deps, "reactions").count({}),
        repository(deps, "savedItems").count({}),
        repository(deps, "posts").aggregate([
          { $match: { status: "published", visibility: "public", deletedAt: null } },
          {
            $group: {
              _id: null,
              views: { $sum: { $ifNull: ["$viewCount", 0] } },
              saves: { $sum: { $ifNull: ["$saveCount", 0] } },
              comments: { $sum: { $ifNull: ["$commentCount", 0] } },
              reactions: { $sum: { $ifNull: ["$reactionCount", 0] } },
            },
          },
        ]),
      ]).then(([comments, reactions, savedItems, postTotals]) => ({
        comments,
        reactions,
        savedItems,
        postTotals: postTotals[0] ?? { views: 0, saves: 0, comments: 0, reactions: 0 },
      })),
      service(deps, "aiMonitoring", "metrics")({ actor, query }),
    ]);
    return {
      range: { from: selectedRange.from, to: selectedRange.to },
      users,
      content,
      reports,
      engagement,
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
    const types = query.type && query.type !== "all" ? [query.type] : Object.keys(reviewableKeys);
    const result = await unionPage(
      types.map((type) => {
        const status = query.status ?? "pending_review";
        const filter = {
          status: status === "all" ? { $ne: "deleted" } : status,
          ...(status === "deleted" ? {} : { deletedAt: null }),
        };
        if (query.from || query.to) {
          const bounds = {};
          if (query.from) bounds.$gte = new Date(query.from);
          if (query.to)
            bounds.$lte = new Date(query.to.length === 10 ? query.to + "T23:59:59.999Z" : query.to);
          filter.createdAt = bounds;
        }
        if (query.authorId) filter.authorId = query.authorId;
        if (query.q)
          filter.title = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        return {
          repository: repository(deps, reviewableKeys[type]),
          filter,
          type,
          projection:
            type === "post"
              ? {
                  ...contentCardProjection,
                  content: 1,
                  visibility: 1,
                  version: 1,
                  viewCount: 1,
                  saveCount: 1,
                  commentCount: 1,
                  reactionCount: 1,
                }
              : contentCardProjection,
        };
      }),
      { page, limit, sort: { createdAt: 1, _id: 1, type: 1 } },
    );
    return {
      ...result,
      data: result.data.map((item) => ({
        ...summarizeContent(item),
        ...(item.type === "post"
          ? {
              content: item.content,
              visibility: item.visibility,
              version: item.version,
              saveCount: item.saveCount,
              commentCount: item.commentCount,
              reactionCount: item.reactionCount,
            }
          : {}),
        type: item.type,
        status: item.status,
      })),
    };
  },
});
