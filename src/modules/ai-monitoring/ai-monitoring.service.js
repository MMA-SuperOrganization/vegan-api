import { z } from "zod";
import {
  admin,
  found,
  idParams,
  id,
  text,
  pagination,
  rangeSchema,
  range,
  repository,
} from "../app-config/index.js";
const features = z.enum(["chat", "meal_plan", "ingredient_recognition", "video_summary"]);
const statuses = z.enum(["pending", "completed", "failed", "blocked"]);
const filters = {
  feature: features.optional(),
  model: text(100).optional(),
  status: statuses.optional(),
};
export const aiMonitoringValidation = {
  getAiRuns: { query: rangeSchema({ ...pagination, ...filters }) },
  getAiRunDetail: { params: idParams },
  getAiMetrics: { query: rangeSchema(filters) },
  getAiFeedback: {
    query: rangeSchema({
      ...pagination,
      feature: features.optional(),
      rating: z.enum(["helpful", "not_helpful"]).optional(),
      aiRunId: id.optional(),
    }),
  },
};
const runProjection = {
  _id: 1,
  feature: 1,
  provider: 1,
  model: 1,
  status: 1,
  latencyMs: 1,
  tokenUsage: 1,
  estimatedCost: 1,
  errorCode: 1,
  createdAt: 1,
  updatedAt: 1,
  "outputMetadata.validated": 1,
};
const numeric = (value) =>
  Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export const safeRun = (run) => ({
  _id: run._id,
  feature: run.feature,
  provider: run.provider,
  model: run.model,
  status: run.status,
  latencyMs: numeric(run.latencyMs),
  tokenUsage: {
    inputTokens: numeric(
      run.tokenUsage?.inputTokens ?? run.tokenUsage?.promptTokens ?? run.tokenUsage?.prompt_tokens,
    ),
    outputTokens: numeric(
      run.tokenUsage?.outputTokens ??
        run.tokenUsage?.completionTokens ??
        run.tokenUsage?.completion_tokens,
    ),
    totalTokens: numeric(run.tokenUsage?.totalTokens ?? run.tokenUsage?.total_tokens),
  },
  ...(run.estimatedCost != null ? { estimatedCost: numeric(run.estimatedCost) } : {}),
  schemaValid: run.outputMetadata?.validated === true,
  ...(typeof run.errorCode === "string" && /^[A-Z0-9_]{1,100}$/.test(run.errorCode)
    ? { errorCode: run.errorCode }
    : {}),
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
});
const makeFilter = (deps, query) => {
  const filter = { createdAt: range(deps, query).filter };
  for (const key of ["feature", "model", "status"]) if (query[key]) filter[key] = query[key];
  return filter;
};
const feedbackRunLookup = (query) => [
  { $lookup: { from: "aiRuns", localField: "aiRunId", foreignField: "_id", as: "run" } },
  { $unwind: "$run" },
  ...(query.feature ? [{ $match: { "run.feature": query.feature } }] : []),
];
export const createAiMonitoringService = (deps) => ({
  async getAiRuns({ actor, query = {} }) {
    admin(actor);
    const result = await repository(deps, "aiRuns").findMany(makeFilter(deps, query), {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: { createdAt: -1, _id: -1 },
      projection: runProjection,
    });
    return { ...result, data: result.data.map(safeRun) };
  },
  async getAiRunDetail({ actor, params }) {
    admin(actor);
    return safeRun(
      found(await repository(deps, "aiRuns").findById(params.id, { projection: runProjection })),
    );
  },
  async getAiMetrics({ actor, query = {} }) {
    admin(actor);
    const selectedRange = range(deps, query);
    const filter = makeFilter(deps, query);
    const [runRows, feedbackRows] = await Promise.all([
      repository(deps, "aiRuns").aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            schemaValid: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$outputMetadata.validated", true] },
                      { $in: ["$status", ["completed", "failed", "blocked"]] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            averageLatencyMs: { $avg: "$latencyMs" },
            inputTokens: {
              $sum: {
                $ifNull: [
                  "$tokenUsage.inputTokens",
                  {
                    $ifNull: [
                      "$tokenUsage.promptTokens",
                      { $ifNull: ["$tokenUsage.prompt_tokens", 0] },
                    ],
                  },
                ],
              },
            },
            outputTokens: {
              $sum: {
                $ifNull: [
                  "$tokenUsage.outputTokens",
                  {
                    $ifNull: [
                      "$tokenUsage.completionTokens",
                      { $ifNull: ["$tokenUsage.completion_tokens", 0] },
                    ],
                  },
                ],
              },
            },
            totalTokens: {
              $sum: {
                $ifNull: ["$tokenUsage.totalTokens", { $ifNull: ["$tokenUsage.total_tokens", 0] }],
              },
            },
            estimatedCost: { $sum: { $ifNull: ["$estimatedCost", 0] } },
          },
        },
      ]),
      repository(deps, "aiFeedback").aggregate([
        { $lookup: { from: "aiRuns", localField: "aiRunId", foreignField: "_id", as: "run" } },
        { $unwind: "$run" },
        {
          $match: Object.fromEntries(
            Object.entries(filter).map(([key, value]) => [`run.${key}`, value]),
          ),
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            helpful: { $sum: { $cond: [{ $eq: ["$rating", "helpful"] }, 1, 0] } },
            runs: { $addToSet: "$aiRunId" },
          },
        },
        { $project: { _id: 0, total: 1, helpful: 1, runsWithFeedback: { $size: "$runs" } } },
      ]),
    ]);
    const stats = runRows[0] ?? {};
    const feedback = feedbackRows[0] ?? {};
    const total = numeric(stats.total);
    const completed = numeric(stats.completed);
    const failed = numeric(stats.failed);
    const blocked = numeric(stats.blocked);
    const terminal = completed + failed + blocked;
    return {
      range: { from: selectedRange.from, to: selectedRange.to },
      runs: { total, completed, failed, blocked, pending: numeric(stats.pending) },
      successRate: terminal ? completed / terminal : null,
      schemaValidRate: terminal ? numeric(stats.schemaValid) / terminal : null,
      averageLatencyMs: stats.averageLatencyMs == null ? null : numeric(stats.averageLatencyMs),
      usage: {
        inputTokens: numeric(stats.inputTokens),
        outputTokens: numeric(stats.outputTokens),
        totalTokens: numeric(stats.totalTokens),
        estimatedCost: numeric(stats.estimatedCost),
      },
      feedback: {
        count: numeric(feedback.total),
        helpful: numeric(feedback.helpful),
        helpfulRate: feedback.total ? numeric(feedback.helpful) / numeric(feedback.total) : null,
        coverageRate: total ? numeric(feedback.runsWithFeedback) / total : null,
      },
      definitions: {
        successRate: "completed / terminal runs (completed + failed + blocked)",
        schemaValidRate: "schema-validated / terminal runs",
        feedbackCoverage: "runs with feedback / runs created in selected range",
        helpfulRate: "helpful votes / feedback votes",
        accuracyAvailable: false,
      },
    };
  },
  async getAiFeedback({ actor, query = {} }) {
    admin(actor);
    const filter = { createdAt: range(deps, query).filter };
    if (query.rating) filter.rating = query.rating;
    if (query.aiRunId) {
      // Mongoose aggregation does not cast ObjectIds; use a safe repository lookup first.
      const run = found(await repository(deps, "aiRuns").findById(query.aiRunId));
      filter.aiRunId = run._id;
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [result] = await repository(deps, "aiFeedback").aggregate([
      { $match: filter },
      ...feedbackRunLookup(query),
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                aiRunId: 1,
                rating: 1,
                createdAt: 1,
                updatedAt: 1,
                feature: "$run.feature",
                model: "$run.model",
              },
            },
          ],
          total: [{ $count: "count" }],
          summary: [{ $group: { _id: "$rating", count: { $sum: 1 } } }],
        },
      },
    ]);
    const total = result?.total?.[0]?.count ?? 0;
    return {
      data: result?.data ?? [],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        summary: Object.fromEntries((result?.summary ?? []).map((item) => [item._id, item.count])),
      },
    };
  },
});
