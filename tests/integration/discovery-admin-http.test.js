import { describe, it, expect } from "vitest";
import request from "supertest";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { TEST_TOKENS, TEST_IDS } from "../helpers/test-app.js";
import { discoveryApp, IDS, WHEN } from "../helpers/discovery-admin-fixtures.js";

const OWNED = [
  "app-config",
  "home",
  "search",
  "recommendations",
  "reports",
  "moderation",
  "admin-dashboard",
  "ai-monitoring",
  "audit-logs",
];
const CASES = [
  ["getAppConfig", "get", "/app/config", null],
  ["bootstrapApp", "get", "/app/bootstrap", TEST_TOKENS.user],
  ["getHomeFeed", "get", "/home", TEST_TOKENS.user],
  ["searchContent", "get", "/search", TEST_TOKENS.user, { query: { q: "Tofu", type: "recipe" } }],
  ["getSearchSuggestions", "get", "/search/suggestions", null, { query: { q: "Tofu" } }],
  ["getRecentSearches", "get", "/search/recent", TEST_TOKENS.user],
  ["clearRecentSearches", "delete", "/search/recent", TEST_TOKENS.user],
  ["deleteRecentSearch", "delete", `/search/recent/${IDS.case}`, TEST_TOKENS.user],
  ["discoverContent", "get", "/discover", null],
  ["getRecipeRecommendations", "get", "/recommendations/recipes", TEST_TOKENS.user],
  ["getContentRecommendations", "get", "/recommendations/content", TEST_TOKENS.user],
  [
    "createReport",
    "post",
    "/reports",
    TEST_TOKENS.user,
    { body: { targetType: "recipe", targetId: IDS.recipe, reason: "spam" }, status: 201 },
  ],
  ["getMyReports", "get", "/reports/mine", TEST_TOKENS.user],
  ["getMyReport", "get", `/reports/mine/${IDS.report}`, TEST_TOKENS.user],
  ["getAdminReports", "get", "/admin/reports", TEST_TOKENS.admin],
  [
    "updateAdminReport",
    "patch",
    `/admin/reports/${IDS.report}`,
    TEST_TOKENS.admin,
    { body: { status: "reviewing", assignedAdminId: TEST_IDS.admin } },
  ],
  ["getModerationCases", "get", "/admin/moderation-cases", TEST_TOKENS.admin],
  [
    "createModerationCase",
    "post",
    "/admin/moderation-cases",
    TEST_TOKENS.admin,
    {
      body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report], priority: "high" },
      status: 201,
    },
  ],
  [
    "updateModerationCase",
    "patch",
    `/admin/moderation-cases/${IDS.case}`,
    TEST_TOKENS.admin,
    { body: { priority: "urgent" } },
  ],
  [
    "hideContent",
    "post",
    `/admin/moderation/post/${IDS.post}/hide`,
    TEST_TOKENS.admin,
    { body: { reason: "Spam" } },
  ],
  [
    "restoreContent",
    "post",
    `/admin/moderation/post/${IDS.post}/restore`,
    TEST_TOKENS.admin,
    { body: { reason: "Review complete" }, hidden: true },
  ],
  ["getDashboardSummary", "get", "/admin/dashboard/summary", TEST_TOKENS.admin],
  ["getContentTrends", "get", "/admin/dashboard/content-trends", TEST_TOKENS.admin],
  ["getUserTrends", "get", "/admin/dashboard/user-trends", TEST_TOKENS.admin],
  ["getPendingContent", "get", "/admin/content/pending", TEST_TOKENS.admin],
  ["getAiRuns", "get", "/admin/ai/runs", TEST_TOKENS.admin],
  ["getAiRunDetail", "get", `/admin/ai/runs/${IDS.run}`, TEST_TOKENS.admin],
  ["getAiMetrics", "get", "/admin/ai/metrics", TEST_TOKENS.admin],
  ["getAiFeedback", "get", "/admin/ai/feedback", TEST_TOKENS.admin],
  ["getAuditLogs", "get", "/admin/audit-logs", TEST_TOKENS.admin],
];
const history = (userId = TEST_IDS.user) => ({
  _id: IDS.case,
  userId,
  query: "Tofu",
  normalizedQuery: "tofu",
  type: "all",
  searchedAt: WHEN,
});
const caseSeed = () => ({
  _id: IDS.case,
  targetType: "post",
  targetId: IDS.post,
  reportIds: [],
  priority: "high",
  status: "open",
  assignedAdminId: TEST_IDS.admin,
  actions: [],
  createdAt: WHEN,
  version: 0,
});
const api = async (app, method, path, token, options = {}) => {
  let query = request(app)[method](`/api/v1${path}`);
  if (token) query = query.set("Authorization", `Bearer ${token}`);
  if (options.query) query = query.query(options.query);
  if (options.body !== undefined) query = query.send(options.body);
  return query;
};
const assertEnvelope = (response, status) => {
  expect(response.status, JSON.stringify(response.body)).toBe(status);
  expect(response.body.success).toBe(status < 400);
  expect(response.body.meta.requestId).toBeTypeOf("string");
  if (status >= 400) expect(response.body.error.code).toBeTypeOf("string");
};

describe("Discovery/admin operation coverage through Supertest", () => {
  it("covers every assigned manifest operation explicitly", () => {
    expect(CASES.map(([operation]) => operation).sort()).toEqual(
      apiManifest
        .filter((op) => OWNED.includes(op.module))
        .map((op) => op.operationId)
        .sort(),
    );
  });
  it.each(CASES)(
    "%s has a happy API path",
    async (operation, method, path, token, options = {}) => {
      const { app, repositories, aggregates } = discoveryApp({
        seed: { searchHistory: [history()], moderation: [caseSeed()] },
      });
      if (options.hidden)
        await repositories.posts.updateOne({ _id: IDS.post }, { $set: { status: "hidden" } });
      const response = await api(app, method, path, token, options);
      assertEnvelope(response, options.status ?? 200);
      const data = response.body.data;
      if (operation === "getAppConfig")
        expect(data).toMatchObject({ features: { ai: false }, limits: { homeSectionSize: 10 } });
      if (operation === "bootstrapApp")
        expect(data).toMatchObject({
          auth: { authenticated: true, user: { id: TEST_IDS.user } },
          unreadCount: 1,
        });
      if (operation === "getHomeFeed") {
        expect(data.featured.posts.map((p) => p._id)).toEqual([IDS.post]);
        expect(data.personalized.recipes.map((r) => r._id)).toEqual([IDS.recipe]);
      }
      if (operation === "searchContent") {
        expect(data.map((r) => r._id)).not.toContain(IDS.hiddenRecipe);
        expect(
          await repositories.searchHistory.findOne({
            userId: TEST_IDS.user,
            type: "recipe",
            normalizedQuery: "tofu",
          }),
        ).not.toBeNull();
      }
      if (operation === "getSearchSuggestions")
        expect(data.every((r) => ["recipe", "food-item", "post", "video"].includes(r.type))).toBe(
          true,
        );
      if (operation === "getRecentSearches") expect(data[0].userId).toBe(TEST_IDS.user);
      if (operation === "clearRecentSearches" || operation === "deleteRecentSearch")
        expect(await repositories.searchHistory.count({ userId: TEST_IDS.user })).toBe(0);
      if (operation === "getRecipeRecommendations")
        expect(data.map((r) => r._id)).toEqual([IDS.recipe]);
      if (operation === "getContentRecommendations" || operation === "discoverContent")
        expect(data.every((item) => item.recommendation.reasons.length > 0)).toBe(true);
      if (operation === "createReport") expect(data.reporterId).toBe(TEST_IDS.user);
      if (operation === "getMyReports") expect(data.map((r) => r._id)).toEqual([IDS.report]);
      if (operation === "getMyReport") expect(data._id).toBe(IDS.report);
      if (operation === "updateAdminReport") {
        expect(data.status).toBe("reviewing");
        expect(await repositories.auditLogs.count({ action: "report.update" })).toBe(1);
      }
      if (operation === "createModerationCase") {
        expect(data.reportIds).toContain(IDS.report);
        expect((await repositories.reports.findById(IDS.report)).status).toBe("reviewing");
      }
      if (operation === "updateModerationCase") expect(data.priority).toBe("urgent");
      if (operation === "hideContent" || operation === "restoreContent") {
        expect(data.content.status).toBe(operation === "hideContent" ? "hidden" : "published");
        expect(data.moderationCase.actions.at(-1).type).toBe(
          operation === "hideContent" ? "hide" : "restore",
        );
      }
      if (operation === "getDashboardSummary") {
        expect(data.content.recipe.pending).toBe(1);
        expect(aggregates.runAggregate).toHaveBeenCalledOnce();
      }
      if (operation.endsWith("Trends")) expect(data.timezone).toBe("UTC");
      if (operation === "getPendingContent")
        expect(data.map((item) => item._id)).toEqual([IDS.pending]);
      if (["getAiRuns", "getAiRunDetail"].includes(operation)) {
        const run = Array.isArray(data) ? data[0] : data;
        expect(run).toMatchObject({ schemaValid: true, tokenUsage: { totalTokens: 8 } });
        expect(run).not.toHaveProperty("inputMetadata");
        expect(run).not.toHaveProperty("userId");
      }
      if (operation === "getAiMetrics") {
        expect(data.successRate).toBeCloseTo(2 / 3);
        expect(data).not.toHaveProperty("accuracy");
      }
      if (operation === "getAiFeedback") {
        expect(data[0]).not.toHaveProperty("comment");
        expect(response.body.meta.summary).toEqual({ helpful: 1 });
      }
      if (operation === "getAuditLogs") {
        expect(data[0].after).toEqual({ status: "published" });
        expect(data[0].before).toEqual({});
      }
    },
  );
  it.each(CASES)(
    "%s rejects important API errors",
    async (operation, method, path, token, options = {}) => {
      const { app } = discoveryApp({
        seed: { searchHistory: [history()], moderation: [caseSeed()] },
      });
      const op = apiManifest.find((item) => item.operationId === operation);
      if (op.auth === "admin") {
        assertEnvelope(await api(app, method, path, TEST_TOKENS.user, options), 403);
        assertEnvelope(await api(app, method, path, null, options), 401);
      } else if (["user", "owner"].includes(op.auth))
        assertEnvelope(await api(app, method, path, null, options), 401);
      else
        assertEnvelope(
          await api(app, method, path, token, { query: { unexpected: "reject" } }),
          400,
        );
    },
  );
});

describe("Discovery privacy, validation and ownership API regressions", () => {
  it("returns guest bootstrap and bounded public home without secret/draft leakage", async () => {
    const { app } = discoveryApp({ envOverrides: { AI_API_KEY: "never-expose-this" } });
    const boot = await api(app, "get", "/app/bootstrap", null);
    expect(boot.body.data).toMatchObject({
      auth: { authenticated: false },
      onboarding: null,
      unreadCount: 0,
      masterDataVersions: { categories: WHEN.toISOString() },
    });
    expect(JSON.stringify(boot.body)).not.toContain("never-expose-this");
    const home = await api(app, "get", "/home", null, { query: { limit: 1 } });
    expect(home.body.data.personalized).toBeNull();
    expect(home.body.data.featured.recipes).toHaveLength(1);
    assertEnvelope(await api(app, "get", "/home", TEST_TOKENS.suspended), 403);
    assertEnvelope(await api(app, "get", "/app/bootstrap", "invalid-token"), 401);
  });
  it("supports aliases, escaped regex, real filters and owner-only recent deletion", async () => {
    const { app, repositories } = discoveryApp({
      seed: { searchHistory: [history(TEST_IDS.other)] },
    });
    let response = await api(app, "get", "/search", null, {
      query: { q: "bean curd", type: "food-item" },
    });
    expect(response.body.data.map((item) => item._id)).toEqual([IDS.food]);
    response = await api(app, "get", "/search", null, { query: { q: ".*", type: "recipe" } });
    expect(response.body.data).toEqual([]);
    response = await api(app, "get", "/search", null, {
      query: { type: "recipe", maxTotalMinutes: 10 },
    });
    expect(response.body.data).toEqual([]);
    assertEnvelope(await api(app, "delete", `/search/recent/${IDS.case}`, TEST_TOKENS.user), 404);
    expect(await repositories.searchHistory.count({ userId: TEST_IDS.other })).toBe(1);
    assertEnvelope(await api(app, "get", "/search/suggestions", null, { query: { q: "" } }), 400);
    assertEnvelope(
      await api(app, "get", "/recommendations/recipes", TEST_TOKENS.user, { query: { limit: 31 } }),
      400,
    );
  });
  it("prevents reporting private/deleted targets, duplicate reports and other owners' access", async () => {
    const { app } = discoveryApp();
    const report = (targetType, targetId) =>
      api(app, "post", "/reports", TEST_TOKENS.user, {
        body: { targetType, targetId, reason: "spam" },
      });
    assertEnvelope(await report("recipe", IDS.privateRecipe), 404);
    assertEnvelope(await report("post", IDS.post), 409);
    assertEnvelope(await report("user", TEST_IDS.deleted), 404);
    assertEnvelope(await report("user", TEST_IDS.suspended), 201);
    assertEnvelope(await api(app, "get", `/reports/mine/${IDS.report}`, TEST_TOKENS.other), 404);
    assertEnvelope(
      await api(app, "patch", `/admin/reports/${IDS.report}`, TEST_TOKENS.admin, {
        body: { status: "resolved" },
      }),
      400,
    );
    assertEnvelope(
      await api(app, "patch", `/admin/reports/${IDS.report}`, TEST_TOKENS.admin, {
        body: { assignedAdminId: TEST_IDS.user },
      }),
      400,
    );
  });
  it("rejects empty PATCH and preserves omitted report/case values", async () => {
    const { app, repositories } = discoveryApp({ seed: { moderation: [caseSeed()] } });
    for (const path of [`/admin/reports/${IDS.report}`, `/admin/moderation-cases/${IDS.case}`])
      assertEnvelope(await api(app, "patch", path, TEST_TOKENS.admin, { body: {} }), 400);
    assertEnvelope(
      await api(app, "patch", `/admin/moderation-cases/${IDS.case}`, TEST_TOKENS.admin, {
        body: { assignedAdminId: null },
      }),
      200,
    );
    const updated = await repositories.moderation.findById(IDS.case);
    expect(updated).toMatchObject({
      priority: "high",
      status: "open",
      assignedAdminId: null,
      reportIds: [],
    });
    assertEnvelope(
      await api(app, "patch", `/admin/reports/${IDS.report}`, TEST_TOKENS.admin, {
        body: { assignedAdminId: TEST_IDS.admin },
      }),
      200,
    );
    expect(await repositories.reports.findById(IDS.report)).toMatchObject({
      status: "open",
      reason: "spam",
      description: "private reporter text",
    });
  });
  it("rolls back incompatible case merges and audit failures, closes linked reports and refuses reopen", async () => {
    const { app, repositories } = discoveryApp({ seed: { moderation: [caseSeed()] } });
    assertEnvelope(
      await api(app, "post", "/admin/moderation-cases", TEST_TOKENS.admin, {
        body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.otherReport] },
      }),
      400,
    );
    expect((await repositories.moderation.findById(IDS.case)).reportIds).toEqual([]);
    const created = await api(app, "post", "/admin/moderation-cases", TEST_TOKENS.admin, {
      body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
    });
    assertEnvelope(created, 201);
    assertEnvelope(
      await api(app, "patch", `/admin/moderation-cases/${IDS.case}`, TEST_TOKENS.admin, {
        body: { status: "resolved", resolution: "Reviewed" },
      }),
      200,
    );
    expect(await repositories.reports.findById(IDS.report)).toMatchObject({
      status: "resolved",
      resolution: "Reviewed",
    });
    expect(await repositories.auditLogs.count({ action: "report.close-case" })).toBe(1);
    assertEnvelope(
      await api(app, "patch", `/admin/moderation-cases/${IDS.case}`, TEST_TOKENS.admin, {
        body: { status: "open" },
      }),
      409,
    );
    assertEnvelope(
      await api(app, "patch", `/admin/reports/${IDS.report}`, TEST_TOKENS.admin, {
        body: { status: "open" },
      }),
      409,
    );
  });
  it("moderation changes public target and writes immutable/redacted audits", async () => {
    const { app, repositories } = discoveryApp();
    assertEnvelope(
      await api(app, "post", `/admin/moderation/post/${IDS.post}/hide`, TEST_TOKENS.admin, {
        body: { reason: "private moderation rationale" },
      }),
      200,
    );
    expect((await repositories.posts.findById(IDS.post)).status).toBe("hidden");
    assertEnvelope(await api(app, "get", `/posts/${IDS.post}`, null), 404);
    assertEnvelope(
      await api(app, "post", `/admin/moderation/post/${IDS.post}/hide`, TEST_TOKENS.admin, {
        body: { reason: "Again" },
      }),
      409,
    );
    assertEnvelope(
      await api(app, "post", `/admin/moderation/post/${IDS.post}/restore`, TEST_TOKENS.admin, {
        body: { reason: "Review complete" },
      }),
      200,
    );
    assertEnvelope(await api(app, "get", `/posts/${IDS.post}`, null), 200);
    const audit = await api(app, "get", "/admin/audit-logs", TEST_TOKENS.admin);
    expect(audit.body.data.some((item) => item.action === "moderation.hide")).toBe(true);
    expect(JSON.stringify(audit.body)).not.toContain("private moderation rationale");
    assertEnvelope(await api(app, "delete", "/admin/audit-logs", TEST_TOKENS.admin), 404);
    assertEnvelope(
      await api(app, "post", `/admin/moderation/post/${IDS.post}/restore`, TEST_TOKENS.admin, {
        body: { reason: "Again" },
      }),
      409,
    );
    assertEnvelope(
      await api(app, "post", `/admin/moderation/post/${IDS.post}/hide`, TEST_TOKENS.admin, {
        body: { reason: "" },
      }),
      400,
    );
  });
  it("hides and restores visible comments using the content public contract", async () => {
    const { app, repositories } = discoveryApp();
    await repositories.posts.updateOne({ _id: IDS.post }, { $set: { commentCount: 1 } });
    assertEnvelope(
      await api(app, "post", `/admin/moderation/comment/${IDS.comment}/hide`, TEST_TOKENS.admin, {
        body: { reason: "Review" },
      }),
      200,
    );
    expect((await repositories.comments.findById(IDS.comment)).status).toBe("hidden");
    expect((await repositories.posts.findById(IDS.post)).commentCount).toBe(0);
    assertEnvelope(
      await api(
        app,
        "post",
        `/admin/moderation/comment/${IDS.comment}/restore`,
        TEST_TOKENS.admin,
        { body: { reason: "Review complete" } },
      ),
      200,
    );
    expect((await repositories.comments.findById(IDS.comment)).status).toBe("visible");
    expect((await repositories.posts.findById(IDS.post)).commentCount).toBe(1);
  });
  it("admin read endpoints enforce ranges, missing IDs, privacy and safe pending projections", async () => {
    const { app } = discoveryApp();
    for (const path of [
      "/admin/dashboard/summary",
      "/admin/dashboard/content-trends",
      "/admin/dashboard/user-trends",
      "/admin/content/pending",
      "/admin/ai/runs",
      "/admin/ai/metrics",
      "/admin/ai/feedback",
      "/admin/audit-logs",
      "/admin/reports",
      "/admin/moderation-cases",
    ]) {
      assertEnvelope(
        await api(app, "get", path, TEST_TOKENS.admin, {
          query: { from: "2026-10-02", to: "2026-01-01" },
        }),
        400,
      );
    }
    assertEnvelope(await api(app, "get", `/admin/ai/runs/${IDS.missing}`, TEST_TOKENS.admin), 404);
    assertEnvelope(
      await api(app, "get", "/admin/ai/feedback", TEST_TOKENS.admin, {
        query: { aiRunId: IDS.missing },
      }),
      404,
    );
    const runs = await api(app, "get", "/admin/ai/runs", TEST_TOKENS.admin);
    expect(JSON.stringify(runs.body)).not.toMatch(/private prompt|private output|userId/);
    const pending = await api(app, "get", "/admin/content/pending", TEST_TOKENS.admin, {
      query: { type: "recipe", q: "Tofu", limit: 1 },
    });
    expect(pending.body.data).toHaveLength(1);
    expect(pending.body.data[0]).not.toHaveProperty("ingredients");
    expect(pending.body.meta.total).toBe(1);
  });
});
