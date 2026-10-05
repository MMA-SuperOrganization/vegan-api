import { apiManifest } from "../../src/routes/api-manifest.js";
import { CREATED } from "../../src/routes/index.js";
import { test, expect, cases, prepare, requestFor, ID, TEST_IDS, TEST_TOKENS } from "./fixtures.js";

const routes = new Map(apiManifest.map((route) => [`${route.method} /api/v1${route.path}`, route]));
// Authentication may update lastLoginAt, but rejected requests must not change business data.
const business = (snapshot) =>
  Object.fromEntries(
    Object.entries(snapshot).map(([key, rows]) => [
      key,
      key === "users" ? rows.map(({ lastLoginAt, updatedAt, ...row }) => row) : rows,
    ]),
  );
const emptyRepos = {
  getCategories: "categories",
  getAllergens: "allergens",
  searchFoodItems: "foodItems",
  getRecipes: "recipes",
  getMyRecipes: "recipes",
  getPosts: "posts",
  getMyPosts: "posts",
  getVideos: "videos",
  getMyVideos: "videos",
  getMyContent: "recipes",
  getComments: "comments",
  getRecentSearches: "searchHistory",
  getMealPlans: "mealPlans",
  getGroceryLists: "groceryLists",
  getDiaryEntries: "diaryEntries",
  getWeightLogs: "weightLogs",
  getWaterLogs: "waterLogs",
  getMyMedia: "mediaAssets",
  getAiConversations: "aiConversations",
  getAiMessages: "aiMessages",
  getNotifications: "notifications",
  getReminders: "reminders",
  getMyReports: "reports",
  getAdminReports: "reports",
  getModerationCases: "moderation",
  getAuditLogs: "auditLogs",
  getViewHistory: "viewHistories",
  getSavedItems: "savedItems",
  getAiRuns: "aiRuns",
  getAiFeedback: "aiFeedback",
  getRecipeRecommendations: "recipes",
  getPantryRecipeSuggestions: "recipes",
  getDiarySummary: "diaryEntries",
  getWeightTrend: "weightLogs",
  getAiMetrics: "aiRuns",
};
const createdRepositories = {
  createRecipe: "recipes",
  createPost: "posts",
  createVideo: "videos",
  createCategory: "categories",
  createAllergen: "allergens",
  createFoodItem: "foodItems",
  createMealPlan: "mealPlans",
  cloneMealPlan: "mealPlans",
  createGroceryList: "groceryLists",
  generateGroceryListFromPlan: "groceryLists",
  createDiaryEntry: "diaryEntries",
  createWeightLog: "weightLogs",
  createWaterLog: "waterLogs",
  createComment: "comments",
  createReport: "reports",
  createReminder: "reminders",
  createAiConversation: "aiConversations",
  createModerationCase: "moderation",
  sendAiMessage: "aiMessages",
};
const idempotent = new Set(["syncAuth", "deleteReaction", "unsaveItem", "deleteRating"]);

for (const c of cases.filter((c) => c.id.startsWith("API-"))) {
  const route = routes.get(c.feature);
  if (!route) throw new Error(`${c.id}: workbook route is not mounted: ${c.feature}`);
  test(
    `${c.id} | ${c.feature} | ${c.type}`,
    {
      tag: [`@${c.priority}`, `@${route.module}`],
      annotation: { type: "Excel", description: `${c.sheet}!A${c.row}: ${c.expected}` },
    },
    async ({ h }, testInfo) => {
      await prepare(h, route);
      const input = requestFor(route);
      input.token = route.auth === "admin" ? TEST_TOKENS.admin : TEST_TOKENS.user;
      let statuses;
      switch (c.type) {
        case "Happy path":
          statuses = [CREATED.has(route.operationId) ? 201 : 200];
          break;
        case "Missing auth":
          input.token = null;
          statuses = [401];
          break;
        case "Invalid auth":
          input.token = "invalid.jwt";
          statuses = [401];
          break;
        case "Role denied":
          input.token = TEST_TOKENS.user;
          statuses = [403];
          break;
        case "Invalid payload":
          input.body = { ...input.body, __unexpected: true };
          statuses = [400];
          break;
        case "Cross-user access":
          input.token = TEST_TOKENS.other;
          statuses = [403, 404];
          break;
        case "Missing target":
          // Replace the leaf target, preserving an existing parent for nested routes.
          for (const key of [
            "itemId",
            "mealId",
            "proposalId",
            "runId",
            "tokenId",
            "targetId",
            "idOrSlug",
            "id",
            "userId",
          ]) {
            if (route.path.includes(`:${key}`)) {
              input.params[key] = ["itemId", "mealId", "tokenId"].includes(key)
                ? "ffffffff-ffff-4fff-8fff-ffffffffffff"
                : ID.missing;
              break;
            }
          }
          statuses = [404];
          break;
        case "Empty result":
          if (emptyRepos[route.operationId])
            h.repositories[emptyRepos[route.operationId]].records.clear();
          else if (route.operationId === "getAdminUsers") input.query.q = "no-matching-user-ever";
          else if (["searchContent", "getSearchSuggestions"].includes(route.operationId))
            input.query.q = "no-matching-content-ever";
          else if (route.operationId === "getExpiringPantryItems")
            h.repositories.pantries.records.clear();
          else if (route.operationId === "getPendingContent")
            for (const key of ["recipes", "posts", "videos"]) h.repositories[key].records.clear();
          else if (
            [
              "getContentRecommendations",
              "discoverContent",
              "getDashboardSummary",
              "getContentTrends",
              "getUserTrends",
              "getMyActivity",
            ].includes(route.operationId)
          ) {
            for (const key of [
              "recipes",
              "posts",
              "videos",
              "comments",
              "reactions",
              "ratings",
              "savedItems",
              "viewHistories",
              "aiRuns",
              "auditLogs",
              "reports",
              "moderation",
            ])
              h.repositories[key].records.clear();
            if (route.path.startsWith("/admin/dashboard"))
              input.query = { from: "2000-01-01", to: "2000-01-02" };
          } else if (route.operationId === "getMyProfileSummary")
            for (const key of ["userProfiles", "nutritionProfiles"])
              h.repositories[key].records.clear();
          else throw new Error(`${c.id}: missing empty fixture for ${route.operationId}`);
          statuses = [200];
          break;
        default:
          throw new Error(`Unimplemented workbook test type: ${c.type}`);
      }
      const before = business(h.snapshot());
      const result = await h.call(route.operationId, input);
      await testInfo.attach("HTTP result", {
        body: JSON.stringify({ status: result.status, response: result.body }, null, 2),
        contentType: "application/json",
      });
      expect(statuses, `${c.id}: ${JSON.stringify(result.body)}`).toContain(result.status);
      expect(result.body.meta?.requestId).toEqual(expect.any(String));
      expect(result.response.headers()["x-request-id"]).toBe(result.body.meta.requestId);
      if (statuses[0] >= 400) {
        expect(result.body.success).toBe(false);
        expect(result.body.error.code).toEqual(expect.any(String));
        expect(result.body).not.toHaveProperty("data");
        expect(business(h.snapshot()), `${c.id}: rejected request changed stored data`).toEqual(
          before,
        );
      } else {
        expect(result.body.success).toBe(true);
        expect(result.body).toHaveProperty("data");
        if (c.type === "Empty result") {
          const list = Array.isArray(result.data)
            ? result.data
            : (result.data?.items ?? result.data?.results ?? result.data?.points);
          if (list !== undefined) expect(list, `${c.id}: expected an empty list`).toEqual([]);
          else if (route.operationId === "getMyProfileSummary") {
            expect(result.data.profile).toBeNull();
            expect(result.data.nutritionProfile).toBeNull();
          } else if (route.operationId === "getDiarySummary") {
            expect(result.data.days).toEqual([]);
            expect(result.data.entryCount).toBe(0);
          } else if (route.operationId === "getAiMetrics") expect(result.data.runs.total).toBe(0);
          else if (route.operationId === "getMyActivity") {
            for (const value of Object.values(result.data.counts)) expect(value).toBe(0);
          } else if (route.operationId === "getDashboardSummary") {
            expect(result.data.ai.runs.total).toBe(0);
            for (const value of Object.values(result.data.content))
              for (const count of Object.values(value)) expect(count).toBe(0);
          } else {
            const arrays = [];
            const collect = (value) => {
              if (Array.isArray(value)) {
                if (!value.length || value.some((item) => item.bucket !== undefined))
                  arrays.push(value);
                else value.forEach(collect);
              } else if (value && typeof value === "object") Object.values(value).forEach(collect);
            };
            collect(result.data);
            expect(
              arrays.length,
              `${c.id}: empty composite response must expose empty sections`,
            ).toBeGreaterThan(0);
            for (const array of arrays) expect(array).toEqual([]);
          }
          if (result.body.meta.total !== undefined) expect(result.body.meta.total).toBe(0);
        }
        // Read repositories independently of the DTO to ensure owner-scoped mutations never touch B.
        if (["POST", "PUT", "PATCH", "DELETE"].includes(route.method) && route.auth !== "admin") {
          for (const [key, rows] of Object.entries(before)) {
            const other = rows.filter(
              (row) =>
                row.userId === TEST_IDS.other ||
                row.ownerId === TEST_IDS.other ||
                row.authorId === TEST_IDS.other ||
                row._id === TEST_IDS.other,
            );
            expect(
              business(h.snapshot())[key].filter(
                (row) =>
                  row.userId === TEST_IDS.other ||
                  row.ownerId === TEST_IDS.other ||
                  row.authorId === TEST_IDS.other ||
                  row._id === TEST_IDS.other,
              ),
            ).toEqual(other);
          }
        }
        if (c.type === "Happy path" && ["POST", "PUT", "PATCH", "DELETE"].includes(route.method)) {
          if (!idempotent.has(route.operationId))
            expect(
              business(h.snapshot()),
              `${c.id}: successful mutation must persist a change`,
            ).not.toEqual(before);
          const repository = createdRepositories[route.operationId];
          if (repository) {
            expect(result.data._id, `${c.id}: created resource ID`).toEqual(
              expect.stringMatching(/^[a-f\d]{24}$/i),
            );
            const stored = await h.repositories[repository].findById(result.data._id);
            expect(stored, `${c.id}: read back created resource independently`).not.toBeNull();
            expect(before[repository].some((row) => row._id === result.data._id)).toBe(false);
            for (const field of ["title", "name", "content", "weightKg", "amountMl"])
              if (input.body[field] !== undefined && route.operationId !== "sendAiMessage")
                expect(stored[field]).toBe(input.body[field]);
            if (route.operationId === "sendAiMessage") {
              expect(stored.content).toBe(result.data.content);
              expect(
                await h.repositories.aiMessages.count({
                  userId: TEST_IDS.user,
                  conversationId: ID.conversation,
                  role: "user",
                  content: input.body.content,
                }),
              ).toBe(1);
            }
          }
          if (["createMealPlanProposal", "recognizeIngredients"].includes(route.operationId)) {
            const stored = await h.repositories.aiProposals.findById(result.data.proposalId);
            expect(stored).toMatchObject({ userId: TEST_IDS.user, status: "pending" });
            expect(h.snapshot().mealPlans).toEqual(before.mealPlans);
            expect(h.snapshot().pantries).toEqual(before.pantries);
          }
          if (["confirmMealPlanProposal", "confirmPantryProposal"].includes(route.operationId))
            expect(await h.repositories.aiProposals.findById(ID.proposal)).toMatchObject({
              userId: TEST_IDS.user,
              status: "confirmed",
              result: { proposalId: ID.proposal },
            });
        }
      }
    },
  );
}
