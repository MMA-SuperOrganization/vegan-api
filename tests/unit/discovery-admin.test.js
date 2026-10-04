import { describe, it, expect, vi } from "vitest";
import { createAppConfigModule } from "../../src/modules/app-config/index.js";
import { createHomeModule } from "../../src/modules/home/index.js";
import { createSearchModule } from "../../src/modules/search/index.js";
import { createRecommendationsModule } from "../../src/modules/recommendations/index.js";
import { createReportsModule } from "../../src/modules/reports/index.js";
import { createModerationModule } from "../../src/modules/moderation/index.js";
import { createAdminDashboardModule } from "../../src/modules/admin-dashboard/index.js";
import { createAiMonitoringModule } from "../../src/modules/ai-monitoring/index.js";
import { createAuditLogsModule, sanitizeAudit } from "../../src/modules/audit-logs/index.js";
import { safeRun } from "../../src/modules/ai-monitoring/ai-monitoring.service.js";
import { AppError } from "../../src/common/errors/app-error.js";
import { range, rangeSchema } from "../../src/modules/app-config/discovery-support.js";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { createMemoryRepositories, memoryTransaction } from "../helpers/memory-repositories.js";
import { TEST_IDS } from "../helpers/test-app.js";
import {
  fixtureSeed,
  content,
  actor,
  administrator,
  IDS,
  WHEN,
  stubAdvancedAggregates,
} from "../helpers/discovery-admin-fixtures.js";

const factories = {
  "audit-logs": createAuditLogsModule,
  "app-config": createAppConfigModule,
  home: createHomeModule,
  search: createSearchModule,
  recommendations: createRecommendationsModule,
  reports: createReportsModule,
  moderation: createModerationModule,
  "admin-dashboard": createAdminDashboardModule,
  "ai-monitoring": createAiMonitoringModule,
};
const defaultCase = () => ({
  _id: IDS.case,
  targetType: "post",
  targetId: IDS.post,
  status: "open",
  priority: "high",
  reportIds: [],
  actions: [],
  assignedAdminId: TEST_IDS.admin,
  createdAt: WHEN,
  version: 0,
});
const harness = (seed = {}) => {
  const users = Object.entries(TEST_IDS).map(([kind, _id]) => ({
    _id,
    role: kind === "admin" ? "admin" : "user",
    status: ["deleted", "suspended"].includes(kind) ? kind : "active",
    deletedAt: kind === "deleted" ? WHEN : null,
  }));
  const repositories = createMemoryRepositories({
    ...fixtureSeed(),
    users,
    moderation: [defaultCase()],
    searchHistory: [
      {
        _id: IDS.case,
        userId: actor.userId,
        query: "Tofu",
        normalizedQuery: "tofu",
        type: "all",
        searchedAt: WHEN,
      },
    ],
    ...seed,
  });
  const deps = {
    repositories,
    services: {},
    clock: () => new Date("2026-10-03T12:00:00Z"),
    transaction: memoryTransaction(repositories),
    env: { ai: { enabled: true }, apiKey: "private-key" },
    publicConfig: { minimumVersion: "1.2.0", apiKey: "private-key" },
  };
  deps.services.users = {
    getById: vi.fn(async (id, options = {}) => {
      const value = await repositories.users.findById(id);
      if (value && !options.allowInactive && value.status !== "active") throw AppError.forbidden();
      return value;
    }),
    getProfile: vi.fn((id) => repositories.userProfiles.findOne({ userId: id })),
    getNutrition: vi.fn((id) => repositories.nutritionProfiles.findOne({ userId: id })),
  };
  deps.services.pantries = {
    getForUser: vi.fn((id) => repositories.pantries.findOne({ userId: id })),
  };
  deps.services.onboarding = {
    getStatus: vi.fn(async () => ({ completed: false, missingFields: ["activityLevel"] })),
  };
  deps.services.notifications = { unreadCount: vi.fn(async () => 1) };
  const keyFor = (type) =>
    ({ recipe: "recipes", post: "posts", video: "videos", comment: "comments" })[type];
  deps.services.content = {
    getTarget: vi.fn(async (type, id, options) => {
      const row = await repositories[keyFor(type)].findById(id);
      if (
        !row ||
        row.deletedAt ||
        row.status === "deleted" ||
        (options.publicOnly &&
          !(type === "comment"
            ? row.status === "visible"
            : row.status === "published" && row.visibility === "public"))
      )
        throw AppError.notFound();
      return row;
    }),
    setVisibility: vi.fn(async ({ targetType, targetId, hidden, session }) => {
      const repo = repositories[keyFor(targetType)];
      const before = await repo.findById(targetId);
      const visible = targetType === "comment" ? "visible" : "published";
      if (before.status !== (hidden ? visible : "hidden")) throw AppError.conflict();
      return repo.updateOne(
        { _id: targetId },
        { $set: { status: hidden ? "hidden" : visible }, $inc: { version: 1 } },
        { session },
      );
    }),
  };
  for (const key of ["recipes", "posts", "videos"])
    deps.services[key] = {
      listPublic: vi.fn((query) =>
        repositories[key].findMany(
          {
            status: "published",
            visibility: "public",
            deletedAt: null,
            ...(query.postType ? { postType: query.postType } : {}),
          },
          { page: query.page, limit: query.limit },
        ),
      ),
    };
  const modules = Object.fromEntries(
    Object.entries(factories).map(([key, factory]) => {
      const value = factory(deps);
      Object.assign(deps.services, value.services);
      return [key, value];
    }),
  );
  const operations = Object.assign({}, ...Object.values(modules).map((value) => value.operations));
  const validation = Object.assign({}, ...Object.values(modules).map((value) => value.validation));
  const call = async (operation, context = {}) => {
    const request = {
      actor,
      query: {},
      params: {},
      body: {},
      requestId: "unit-request",
      ipHash: "unit-ip-hash",
      ...context,
    };
    for (const key of ["query", "params", "body"])
      if (validation[operation][key]) request[key] = validation[operation][key].parse(request[key]);
    return operations[operation](request);
  };
  return {
    deps,
    repositories,
    modules,
    operations,
    validation,
    call,
    aggregates: stubAdvancedAggregates(repositories),
  };
};
const CASES = [
  ["getAppConfig", {}],
  ["bootstrapApp", {}],
  ["getHomeFeed", {}],
  ["searchContent", { query: { q: "Tofu" } }],
  ["getSearchSuggestions", { query: { q: "Tofu" } }],
  ["getRecentSearches", {}],
  ["clearRecentSearches", {}],
  ["deleteRecentSearch", { params: { id: IDS.case } }],
  ["discoverContent", {}],
  ["getRecipeRecommendations", {}],
  ["getContentRecommendations", {}],
  ["createReport", { body: { targetType: "recipe", targetId: IDS.recipe, reason: "spam" } }],
  ["getMyReports", {}],
  ["getMyReport", { params: { id: IDS.report } }],
  ["getAdminReports", { actor: administrator }],
  [
    "updateAdminReport",
    { actor: administrator, params: { id: IDS.report }, body: { status: "reviewing" } },
  ],
  ["getModerationCases", { actor: administrator }],
  [
    "createModerationCase",
    {
      actor: administrator,
      body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
    },
  ],
  [
    "updateModerationCase",
    { actor: administrator, params: { id: IDS.case }, body: { priority: "urgent" } },
  ],
  [
    "hideContent",
    {
      actor: administrator,
      params: { targetType: "post", targetId: IDS.post },
      body: { reason: "Review" },
    },
  ],
  [
    "restoreContent",
    {
      actor: administrator,
      params: { targetType: "post", targetId: IDS.post },
      body: { reason: "Review" },
      hidden: true,
    },
  ],
  ["getDashboardSummary", { actor: administrator }],
  ["getContentTrends", { actor: administrator }],
  ["getUserTrends", { actor: administrator }],
  ["getPendingContent", { actor: administrator }],
  ["getAiRuns", { actor: administrator }],
  ["getAiRunDetail", { actor: administrator, params: { id: IDS.run } }],
  ["getAiMetrics", { actor: administrator }],
  ["getAiFeedback", { actor: administrator }],
  ["getAuditLogs", { actor: administrator }],
];

describe("Dedicated discovery/admin units for every assigned operation", () => {
  it("matches assigned operations, without replacing missing endpoints", () =>
    expect(CASES.map(([op]) => op).sort()).toEqual(
      apiManifest
        .filter((op) => Object.hasOwn(factories, op.module))
        .map((op) => op.operationId)
        .sort(),
    ));
  it.each(CASES)(
    "%s executes validated happy input against injected dependencies",
    async (operation, context) => {
      const h = harness();
      if (context.hidden)
        await h.repositories.posts.updateOne({ _id: IDS.post }, { $set: { status: "hidden" } });
      const result = await h.call(operation, context);
      expect(result).not.toBeUndefined();
      if (operation === "createReport")
        expect(result).toMatchObject({ reporterId: TEST_IDS.user, status: "open" });
      if (operation === "getRecipeRecommendations")
        expect(result.data.map((item) => item._id)).toEqual([IDS.recipe]);
      if (operation === "searchContent")
        expect(await h.repositories.searchHistory.count({ userId: TEST_IDS.user })).toBe(1);
      if (operation === "clearRecentSearches" || operation === "deleteRecentSearch")
        expect(await h.repositories.searchHistory.count()).toBe(0);
      if (operation === "bootstrapApp")
        expect(h.deps.services.notifications.unreadCount).toHaveBeenCalledWith(TEST_IDS.user);
      if (operation === "hideContent" || operation === "restoreContent")
        expect(h.deps.services.content.setVisibility).toHaveBeenCalledWith(
          expect.objectContaining({
            targetType: "post",
            hidden: operation === "hideContent",
            session: { inMemory: true },
          }),
        );
      if (operation === "updateAdminReport")
        expect(await h.repositories.auditLogs.count({ action: "report.update" })).toBe(1);
    },
  );
  it.each(CASES)(
    "%s rejects its critical boundary or service error",
    async (operation, context) => {
      const h = harness();
      const op = apiManifest.find((item) => item.operationId === operation);
      if (op.auth === "admin")
        await expect(h.call(operation, { ...context, actor })).rejects.toMatchObject({
          statusCode: 403,
        });
      else if (["owner", "user"].includes(op.auth))
        await expect(h.call(operation, { ...context, actor: null })).rejects.toMatchObject({
          statusCode: 401,
        });
      else
        await expect(h.call(operation, { ...context, query: { unknown: true } })).rejects.toThrow();
    },
  );
});

describe("Discovery behavior and input safety", () => {
  it("whitelists public flags, version policy, guest bootstrap and bounded summary fields", async () => {
    const h = harness();
    const config = await h.call("getAppConfig");
    expect(config).toMatchObject({ versionPolicy: { minimum: "1.2.0" }, features: { ai: true } });
    expect(JSON.stringify(config)).not.toContain("private-key");
    const guest = await h.call("bootstrapApp", { actor: null });
    expect(guest).toMatchObject({
      auth: { authenticated: false },
      onboarding: null,
      unreadCount: 0,
    });
    expect(h.deps.services.users.getById).not.toHaveBeenCalled();
    const home = await h.call("getHomeFeed", { actor: null, query: { limit: 1 } });
    expect(home.featured.recipes).toHaveLength(1);
    expect(home.featured.posts[0]._id).toBe(IDS.post);
    expect(h.deps.services.posts.listPublic).toHaveBeenCalledWith(
      expect.objectContaining({ postType: "blog" }),
    );
    expect(home.featured.recipes[0]).not.toHaveProperty("ingredients");
  });
  it("fails closed on bootstrap or home dependencies rather than fabricate counts", async () => {
    const h = harness();
    delete h.deps.services.notifications;
    await expect(h.call("bootstrapApp")).rejects.toMatchObject({
      code: "DEPENDENCY_UNAVAILABLE",
      statusCode: 503,
    });
    delete h.deps.services.recipes;
    await expect(h.call("getHomeFeed", { actor: null })).rejects.toMatchObject({
      code: "DEPENDENCY_UNAVAILABLE",
    });
  });
  it("does not implicitly add maxTotalMinutes from Zod defaults", () => {
    const h = harness();
    expect(h.validation.searchContent.query.parse({})).not.toHaveProperty("maxTotalMinutes");
    expect(h.validation.updateModerationCase.body.parse({ assignedAdminId: null })).toEqual({
      assignedAdminId: null,
    });
    expect(h.validation.updateAdminReport.body.parse({ assignedAdminId: null })).toEqual({
      assignedAdminId: null,
    });
    expect(() => h.validation.updateModerationCase.body.parse({})).toThrow();
    expect(() => h.validation.updateAdminReport.body.parse({})).toThrow();
  });
  it("filters active/public content and applies diet/category/allergens and aliases", async () => {
    const h = harness();
    const query = {
      type: "recipe",
      category: IDS.category,
      cuisine: "Vietnamese",
      difficulty: "easy",
      maxTotalMinutes: 30,
      excludeAllergenIds: IDS.allergen,
      dietType: "vegan",
    };
    const result = await h.call("searchContent", { actor: null, query });
    expect(result.data.map((item) => item._id).sort()).toEqual(
      [IDS.recipe, IDS.ingredientAllergyRecipe].sort(),
    );
    const aliases = await h.call("getSearchSuggestions", {
      query: { q: "bean curd", type: "food-item" },
    });
    expect(aliases).toEqual([{ id: IDS.food, type: "food-item", text: "Tofu", slug: "tofu" }]);
    expect((await h.call("searchContent", { actor: null, query: { q: ".*" } })).data).toEqual([]);
  });
  it.each(["vegetarian", "lacto_vegetarian", "ovo_vegetarian", "lacto_ovo_vegetarian"])(
    "applies accepted %s food diet filters",
    async (dietType) => {
      const h = harness({
        foodItems: [
          {
            _id: IDS.food,
            name: "Plant food",
            status: "active",
            isVegetarian: true,
            containsEggs: false,
            containsDairy: false,
          },
          {
            _id: IDS.allergicFood,
            name: "Meat",
            status: "active",
            isVegetarian: false,
            isVegan: false,
          },
        ],
      });
      const result = await h.call("searchContent", {
        actor: null,
        query: { type: "food-item", dietType },
      });
      expect(result.data.map((item) => item._id)).toEqual([IDS.food]);
    },
  );
  it("sorts and pages mixed-domain oldest results deterministically, with total counts", async () => {
    const h = harness({
      recipes: [
        content({ _id: "200000000000000000000002" }),
        content({ _id: "200000000000000000000001", slug: "other" }),
      ],
      posts: [],
      videos: [],
      foodItems: [],
    });
    const result = await h.call("searchContent", {
      actor: null,
      query: { sort: "oldest", limit: 1, page: 2 },
    });
    expect(result.data[0]._id).toBe("200000000000000000000002");
    expect(result.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });
  it("retains viewCount for global popular ordering instead of sorting summaries by ID", async () => {
    const h = harness({
      recipes: [
        content({ _id: IDS.recipe, viewCount: 100 }),
        content({ _id: IDS.allergicRecipe, slug: "unpopular", viewCount: 1 }),
      ],
      posts: [content({ _id: IDS.post, viewCount: 50 })],
      videos: [],
      foodItems: [],
    });
    const result = await h.call("searchContent", { actor: null, query: { sort: "popular" } });
    expect(result.data.map((item) => item._id)).toEqual([IDS.recipe, IDS.post, IDS.allergicRecipe]);
  });
  it("records/deduplicates bounded history and deletes only owner rows", async () => {
    const seed = Array.from({ length: 51 }, (_, index) => ({
      _id: (index + 1).toString(16).padStart(24, "0"),
      userId: actor.userId,
      query: `old ${index}`,
      normalizedQuery: `old ${index}`,
      type: "all",
      searchedAt: new Date(WHEN.getTime() - index * 1000),
    }));
    const h = harness({
      searchHistory: [
        ...seed,
        { _id: IDS.case, userId: TEST_IDS.other, query: "private", searchedAt: WHEN },
      ],
    });
    await h.call("searchContent", { query: { q: "Tofu" } });
    await h.call("searchContent", { query: { q: "TOFU" } });
    expect(await h.repositories.searchHistory.count({ userId: actor.userId })).toBe(50);
    const recent = await h.call("getRecentSearches");
    expect(recent.data[0]).toMatchObject({ query: "TOFU", normalizedQuery: "tofu" });
    await expect(h.call("deleteRecentSearch", { params: { id: IDS.case } })).rejects.toMatchObject({
      statusCode: 404,
    });
    await h.call("clearRecentSearches");
    expect(await h.repositories.searchHistory.count()).toBe(1);
  });
  it("ranks diet/pantry/calorie/goal and excludes snapshot and current food allergens", async () => {
    const h = harness();
    const result = await h.call("getRecipeRecommendations");
    expect(result.data.map((item) => item._id)).toEqual([IDS.recipe]);
    expect(result.data[0].recommendation).toMatchObject({
      score: 100,
      pantryMatch: { matched: 1, total: 1 },
      allergenExclusionsApplied: true,
    });
    expect(result.data[0].recommendation.reasons).toHaveLength(4);
    const contentResult = await h.call("getContentRecommendations");
    expect(contentResult.data.map((item) => item._id)).toContain(IDS.video);
    expect(
      (await h.call("discoverContent", { actor: null })).data.every(
        (item) => item.recommendation.reasons.length,
      ),
    ).toBe(true);
  });
  it("does not count expired or zero pantry quantities and fails closed on user context", async () => {
    const h = harness({
      pantries: [
        {
          userId: actor.userId,
          items: [
            { foodItemId: IDS.food, quantity: 0 },
            { foodItemId: IDS.food, quantity: 1, expiresAt: WHEN },
          ],
        },
      ],
    });
    const result = await h.call("getRecipeRecommendations");
    expect(result.data[0].recommendation.pantryMatch.matched).toBe(0);
    await expect(
      h.call("getRecipeRecommendations", { actor: { ...actor, status: "suspended" } }),
    ).rejects.toMatchObject({ statusCode: 403 });
    delete h.deps.services.users;
    await expect(h.call("getRecipeRecommendations")).rejects.toMatchObject({ statusCode: 503 });
  });
  it("validates strict dates and bounds one-sided and explicit ranges", () => {
    const h = harness();
    expect(() => rangeSchema().parse({ from: "2026-02-30" })).toThrow();
    expect(() => rangeSchema().parse({ from: "2024-01-01", to: "2026-01-01" })).toThrow();
    expect(() => range(h.deps, { from: "2024-01-01" })).toThrow();
    expect(range(h.deps, { from: "2026-10-01", to: "2026-10-02" }).to.toISOString()).toBe(
      "2026-10-02T23:59:59.999Z",
    );
  });
});

describe("Report/moderation transactions, lifecycle, CAS and audit", () => {
  it("validates targets, safe active-admin assignment and duplicate reports", async () => {
    const h = harness();
    await expect(
      h.call("createReport", { body: { targetType: "post", targetId: IDS.post, reason: "spam" } }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      h.call("createReport", {
        body: { targetType: "recipe", targetId: IDS.privateRecipe, reason: "spam" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      h.call("createReport", {
        body: { targetType: "user", targetId: TEST_IDS.deleted, reason: "spam" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(
      (
        await h.call("createReport", {
          body: { targetType: "user", targetId: TEST_IDS.suspended, reason: "spam" },
        })
      ).status,
    ).toBe("open");
    for (const id of [TEST_IDS.user, TEST_IDS.suspended])
      await expect(
        h.call("updateAdminReport", {
          actor: administrator,
          params: { id: IDS.report },
          body: { assignedAdminId: id },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    await expect(h.call("getMyReport", { params: { id: IDS.otherReport } })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
  it("closes with resolution, refuses reopen and rolls back on audit write failure", async () => {
    const h = harness();
    await expect(
      h.call("updateAdminReport", {
        actor: administrator,
        params: { id: IDS.report },
        body: { status: "resolved" },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    const closed = await h.call("updateAdminReport", {
      actor: administrator,
      params: { id: IDS.report },
      body: { status: "resolved", resolution: "Checked" },
    });
    expect(closed.resolvedAt).toEqual(h.deps.clock());
    await expect(
      h.call("updateAdminReport", {
        actor: administrator,
        params: { id: IDS.report },
        body: { status: "open" },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    h.deps.services.audit.record = vi.fn(async () => {
      throw new Error("audit unavailable");
    });
    await expect(
      h.call("updateAdminReport", {
        actor: administrator,
        params: { id: IDS.otherReport },
        body: { status: "reviewing" },
      }),
    ).rejects.toThrow("audit unavailable");
    expect((await h.repositories.reports.findById(IDS.otherReport)).status).toBe("open");
  });
  it("uses compare-and-set and refuses partial work without transaction support", async () => {
    const h = harness();
    vi.spyOn(h.repositories.reports, "updateOne").mockResolvedValueOnce(null);
    await expect(
      h.call("updateAdminReport", {
        actor: administrator,
        params: { id: IDS.report },
        body: { status: "reviewing" },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    delete h.deps.transaction;
    await expect(
      h.call("createModerationCase", {
        actor: administrator,
        body: { targetType: "video", targetId: IDS.video },
      }),
    ).rejects.toMatchObject({ code: "TRANSACTIONS_REQUIRED" });
    expect(await h.repositories.moderation.count()).toBe(1);
  });
  it("merges idempotently without resetting omitted priority and audits linked reports", async () => {
    const h = harness();
    const input = {
      actor: administrator,
      body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
    };
    const merged = await h.call("createModerationCase", input);
    expect(merged).toMatchObject({ priority: "high", reportIds: [IDS.report] });
    expect((await h.call("createModerationCase", input)).reportIds).toEqual([IDS.report]);
    expect(await h.repositories.moderation.count()).toBe(1);
    expect(await h.repositories.auditLogs.count({ action: "report.link-case" })).toBe(2);
    const closed = await h.call("updateModerationCase", {
      actor: administrator,
      params: { id: IDS.case },
      body: { status: "dismissed", resolution: "No violation" },
    });
    expect(closed.reportIds).toEqual([IDS.report]);
    expect(await h.repositories.reports.findById(IDS.report)).toMatchObject({
      status: "dismissed",
      resolution: "No violation",
    });
    await expect(
      h.call("updateModerationCase", {
        actor: administrator,
        params: { id: IDS.case },
        body: { status: "open" },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it("rejects different target/case and closed report links atomically", async () => {
    const h = harness();
    await expect(
      h.call("createModerationCase", {
        actor: administrator,
        body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.otherReport] },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((await h.repositories.moderation.findById(IDS.case)).reportIds).toEqual([]);
    await h.repositories.reports.updateOne(
      { _id: IDS.report },
      { $set: { moderationCaseId: IDS.missing } },
    );
    await expect(
      h.call("createModerationCase", {
        actor: administrator,
        body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await h.repositories.reports.updateOne(
      { _id: IDS.report },
      { $set: { moderationCaseId: null, status: "resolved" } },
    );
    await expect(
      h.call("createModerationCase", {
        actor: administrator,
        body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      h.call("hideContent", {
        actor: administrator,
        params: { targetType: "video", targetId: IDS.video },
        body: { reason: "Review", caseId: IDS.case },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((await h.repositories.videos.findById(IDS.video)).status).toBe("published");
  });
  it("bounds cumulative report merges, not only each request's reportIds", async () => {
    const ids = Array.from({ length: 50 }, (_, index) =>
      (index + 1).toString(16).padStart(24, "0"),
    );
    const h = harness({ moderation: [{ ...defaultCase(), reportIds: ids }] });
    await expect(
      h.call("createModerationCase", {
        actor: administrator,
        body: { targetType: "post", targetId: IDS.post, reportIds: [IDS.report] },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      h.call("updateModerationCase", {
        actor: administrator,
        params: { id: IDS.case },
        body: { reportIds: [IDS.report] },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((await h.repositories.moderation.findById(IDS.case)).reportIds).toHaveLength(50);
    expect(await h.repositories.auditLogs.count({ targetType: "moderation-case" })).toBe(0);
  });
  it("rolls back target visibility on case conflict or audit failure", async () => {
    const h = harness();
    const input = {
      actor: administrator,
      params: { targetType: "post", targetId: IDS.post },
      body: { reason: "Review" },
    };
    vi.spyOn(h.repositories.moderation, "updateOne").mockResolvedValueOnce(null);
    await expect(h.call("hideContent", input)).rejects.toMatchObject({ statusCode: 409 });
    expect((await h.repositories.posts.findById(IDS.post)).status).toBe("published");
    h.deps.services.audit.record = vi.fn(async () => {
      throw new Error("audit write failed");
    });
    await expect(h.call("hideContent", input)).rejects.toThrow("audit write failed");
    expect((await h.repositories.posts.findById(IDS.post)).status).toBe("published");
  });
});

describe("Real aggregation pipeline contracts (stubbed responses, no Mongo calculation claim)", () => {
  const time = { $gte: new Date("2026-10-01"), $lte: new Date("2026-10-02T23:59:59.999Z") };
  const query = { from: "2026-10-01", to: "2026-10-02" };
  it("builds filtered terminal/schema-valid/usage metrics and run-linked feedback coverage pipelines", async () => {
    const h = harness();
    const result = await h.call("getAiMetrics", {
      actor: administrator,
      query: { ...query, feature: "chat", model: "test-model", status: "completed" },
    });
    const [runPipeline] = h.aggregates.runAggregate.mock.calls[0];
    expect(runPipeline[0]).toEqual({
      $match: { createdAt: time, feature: "chat", model: "test-model", status: "completed" },
    });
    expect(runPipeline[1].$group.completed).toEqual({
      $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
    });
    expect(runPipeline[1].$group.schemaValid).toEqual({
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
    });
    expect(runPipeline[1].$group.inputTokens).toEqual({
      $sum: {
        $ifNull: [
          "$tokenUsage.inputTokens",
          { $ifNull: ["$tokenUsage.promptTokens", { $ifNull: ["$tokenUsage.prompt_tokens", 0] }] },
        ],
      },
    });
    expect(runPipeline[1].$group.outputTokens).toEqual({
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
    });
    expect(runPipeline[1].$group.totalTokens).toEqual({
      $sum: { $ifNull: ["$tokenUsage.totalTokens", { $ifNull: ["$tokenUsage.total_tokens", 0] }] },
    });
    const [feedbackPipeline] = h.aggregates.feedbackAggregate.mock.calls[0];
    expect(feedbackPipeline).toEqual([
      { $lookup: { from: "aiRuns", localField: "aiRunId", foreignField: "_id", as: "run" } },
      { $unwind: "$run" },
      {
        $match: {
          "run.createdAt": time,
          "run.feature": "chat",
          "run.model": "test-model",
          "run.status": "completed",
        },
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
    ]);
    expect(result).toMatchObject({
      successRate: 2 / 3,
      schemaValidRate: 2 / 3,
      averageLatencyMs: 25,
      usage: { totalTokens: 30 },
      feedback: { coverageRate: 0.5, helpfulRate: 0.5 },
      definitions: { accuracyAvailable: false },
    });
    expect(result).not.toHaveProperty("accuracy");
  });
  it("returns null rates for zero denominators rather than fabricated quality", async () => {
    const h = harness();
    h.aggregates.runAggregate.mockResolvedValue([]);
    h.aggregates.feedbackAggregate.mockResolvedValue([]);
    const result = await h.call("getAiMetrics", { actor: administrator });
    expect(result).toMatchObject({
      runs: { total: 0 },
      successRate: null,
      schemaValidRate: null,
      averageLatencyMs: null,
      feedback: { count: 0, helpfulRate: null, coverageRate: null },
    });
  });
  it("casts feedback IDs through run lookup, paginates and projects only safe feedback metadata", async () => {
    const h = harness();
    const result = await h.call("getAiFeedback", {
      actor: administrator,
      query: { ...query, feature: "chat", aiRunId: IDS.run, rating: "helpful", page: 2, limit: 5 },
    });
    const [pipeline] = h.aggregates.feedbackAggregate.mock.calls[0];
    expect(pipeline[0]).toEqual({
      $match: { createdAt: time, rating: "helpful", aiRunId: IDS.run },
    });
    expect(pipeline[3]).toEqual({ $match: { "run.feature": "chat" } });
    expect(pipeline.at(-1).$facet.data).toEqual([
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: 5 },
      { $limit: 5 },
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
    ]);
    expect(result.meta).toMatchObject({ page: 2, limit: 5, total: 1, summary: { helpful: 1 } });
    expect(result.data[0]).not.toHaveProperty("comment");
  });
  it("builds UTC publication/report trend buckets without loading raw content", async () => {
    const h = harness();
    await h.call("getContentTrends", {
      actor: administrator,
      query: { ...query, interval: "week" },
    });
    expect(h.aggregates.trendAggregates.recipes).toHaveBeenCalledWith([
      { $match: { publishedAt: time, deletedAt: null } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$publishedAt", unit: "week", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, bucket: "$_id", count: 1 } },
    ]);
    expect(
      h.aggregates.trendAggregates.reports.mock.calls.map(
        ([pipeline]) => pipeline[0].$match.targetType,
      ),
    ).toEqual(["recipe", "post", "video"]);
  });
  it("groups user latest login (not DAU) and distinct suspension targets from audits", async () => {
    const h = harness();
    const result = await h.call("getUserTrends", {
      actor: administrator,
      query: { ...query, interval: "month" },
    });
    expect(h.aggregates.trendAggregates.users.mock.calls[1][0][0]).toEqual({
      $match: { lastLoginAt: time, deletedAt: null, status: "active" },
    });
    expect(h.aggregates.trendAggregates.auditLogs.mock.calls[0][0]).toEqual([
      {
        $match: {
          createdAt: time,
          action: { $in: ["user.suspend", "users.suspend", "suspendUser"] },
          targetType: "user",
        },
      },
      {
        $group: {
          _id: {
            bucket: { $dateTrunc: { date: "$createdAt", unit: "month", timezone: "UTC" } },
            targetId: "$targetId",
          },
        },
      },
      { $group: { _id: "$_id.bucket", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, bucket: "$_id", count: 1 } },
    ]);
    expect(result.definitions.activeUsers).toContain("not DAU");
  });
  it("summarizes repository counts and safely filters/pages pending inventory", async () => {
    const h = harness();
    const summary = await h.call("getDashboardSummary", { actor: administrator, query });
    expect(summary).toMatchObject({
      users: { total: 4, active: 3, suspended: 1 },
      content: { recipe: { publishedInRange: 3, pending: 1, hidden: 1 } },
      reports: { open: 2 },
    });
    const pending = await h.call("getPendingContent", {
      actor: administrator,
      query: { ...query, type: "recipe", q: "Tofu", authorId: TEST_IDS.user },
    });
    expect(pending.data.map((row) => row._id)).toEqual([IDS.pending]);
    expect(pending.data[0]).not.toHaveProperty("ingredients");
    expect(
      (await h.call("getPendingContent", { actor: administrator, query: { ...query, q: ".*" } }))
        .data,
    ).toEqual([]);
  });
});

describe("Audit and AI read privacy", () => {
  it("redacts nested secrets, free text, tokens and bounded deep/large snapshots", () => {
    const snapshot = {
      status: "active",
      email: "private@test",
      fcmTokens: ["secret"],
      inputMetadata: { prompt: "medical" },
      actions: [{ type: "hide", reason: "private rationale", beforeStatus: "published" }],
      safe: "Bearer credential",
      rows: Array(100).fill({ password: "secret", version: 1 }),
    };
    expect(sanitizeAudit(snapshot)).toEqual({
      status: "active",
      inputMetadata: {},
      actions: [{ type: "hide", beforeStatus: "published" }],
      safe: "[redacted]",
      rows: Array(50).fill({ version: 1 }),
    });
    const deep = { a: { b: { c: { d: { e: { f: { secret: "x" } } } } } } };
    expect(JSON.stringify(sanitizeAudit(deep))).toContain("truncated");
  });
  it("writes session/request/actor metadata and re-redacts historical logs on reads", async () => {
    const h = harness();
    const session = { testSession: true };
    const create = vi.spyOn(h.repositories.auditLogs, "create");
    await h.deps.services.audit.record({
      actor: administrator,
      action: "user.suspend",
      targetType: "user",
      targetId: TEST_IDS.other,
      before: { status: "active", email: "secret" },
      after: { status: "suspended", token: "secret" },
      requestId: "request",
      ipHash: "hash",
      session,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: TEST_IDS.admin,
        actorRole: "admin",
        before: { status: "active" },
        after: { status: "suspended" },
        requestId: "request",
        ipHash: "hash",
        createdAt: h.deps.clock(),
      }),
      { session },
    );
    const logs = await h.call("getAuditLogs", { actor: administrator });
    expect(JSON.stringify(logs)).not.toContain("secret");
    await expect(h.deps.services.audit.record({ action: "bad" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
  it("projects AI runs without prompt/user identity and normalizes only numeric usage/stable error codes", async () => {
    const h = harness();
    const find = vi.spyOn(h.repositories.aiRuns, "findMany");
    await h.call("getAiRuns", {
      actor: administrator,
      query: { status: "completed", model: "test-model", feature: "chat" },
    });
    expect(find.mock.calls[0][0]).toMatchObject({
      status: "completed",
      model: "test-model",
      feature: "chat",
    });
    expect(find.mock.calls[0][1].projection).not.toHaveProperty("inputMetadata");
    expect(find.mock.calls[0][1].projection).not.toHaveProperty("userId");
    const value = safeRun({
      _id: IDS.run,
      latencyMs: -1,
      tokenUsage: { inputTokens: "4", outputTokens: Infinity, total_tokens: 4 },
      errorCode: "Bearer private-provider-error",
      outputMetadata: { validated: true, raw: "private" },
      inputMetadata: { prompt: "private" },
    });
    expect(value).toMatchObject({
      latencyMs: 0,
      tokenUsage: { inputTokens: 4, outputTokens: 0, totalTokens: 4 },
      schemaValid: true,
    });
    expect(value).not.toHaveProperty("errorCode");
    expect(value).not.toHaveProperty("inputMetadata");
    await expect(
      h.call("getAiRunDetail", { actor: administrator, params: { id: IDS.missing } }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
