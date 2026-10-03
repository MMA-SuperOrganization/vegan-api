import { describe, it, expect, vi } from "vitest";
import { createUsersModule } from "../../src/modules/users/index.js";
import { createNutritionProfilesModule } from "../../src/modules/nutrition-profiles/index.js";
import { createCategoriesModule } from "../../src/modules/categories/index.js";
import { createAllergensModule } from "../../src/modules/allergens/index.js";
import { createFoodItemsModule } from "../../src/modules/food-items/index.js";
import { createMemoryRepositories, memoryTransaction } from "../helpers/memory-repositories.js";
const USER = "100000000000000000000001";
const ADMIN = "100000000000000000000002";
const ONE = "200000000000000000000001";
const TWO = "200000000000000000000002";
const actor = { userId: USER, role: "user", status: "active" };
const admin = { userId: ADMIN, role: "admin", status: "active" };
const fixture = ({ existingNutrition = false } = {}) => {
  const repositories = createMemoryRepositories({
    users: [
      {
        _id: USER,
        firebaseUid: "user",
        role: "user",
        status: "active",
        fcmTokens: [],
        fcmTokensVersion: 0,
      },
      {
        _id: ADMIN,
        firebaseUid: "admin",
        role: "admin",
        status: "active",
        fcmTokens: [],
        fcmTokensVersion: 0,
      },
    ],
    userProfiles: [{ userId: USER, dateOfBirth: "1995-01-01", gender: "female" }],
    nutritionProfiles: existingNutrition
      ? [
          {
            userId: USER,
            heightCm: 170,
            currentWeightKg: 65,
            activityLevel: "moderate",
            goal: "maintain",
            manualTargetFields: [],
            version: 0,
          },
        ]
      : [],
    categories: [
      { _id: ONE, status: "active" },
      { _id: TWO, status: "active" },
    ],
    allergens: [
      { _id: ONE, status: "active" },
      { _id: TWO, status: "active" },
    ],
    foodItems: [
      { _id: ONE, status: "active" },
      { _id: TWO, status: "active" },
    ],
  });
  const deps = {
    repositories,
    services: {},
    clock: () => new Date("2026-10-03T12:00:00Z"),
    transaction: memoryTransaction(repositories),
    audit: { record: vi.fn(async () => {}) },
  };
  const modules = [
    createUsersModule,
    createNutritionProfilesModule,
    createCategoriesModule,
    createAllergensModule,
    createFoodItemsModule,
  ].map((factory) => {
    const module = factory(deps);
    Object.assign(deps.services, module.services);
    return module;
  });
  return { deps, repositories, users: modules[0], nutrition: modules[1] };
};
const gateTwoReads = (repository, relevant) => {
  const original = repository.findOne.bind(repository);
  let arrivals = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  vi.spyOn(repository, "findOne").mockImplementation(async (filter, options) => {
    const result = await original(filter, options);
    if (relevant(filter) && arrivals < 2) {
      arrivals++;
      if (arrivals === 2) release();
      await gate;
    }
    return result;
  });
};
describe("identity transaction and concurrency regressions", () => {
  it.each(["categories", "allergens", "foodItems"])(
    "%s getMany never overlaps reads on one session",
    async (key) => {
      const { deps, repositories } = fixture();
      const original = repositories[key].findOne.bind(repositories[key]);
      let active = 0;
      let maxActive = 0;
      vi.spyOn(repositories[key], "findOne").mockImplementation(async (...args) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        try {
          return await original(...args);
        } finally {
          active--;
        }
      });
      const result = await deps.services[key].getMany([ONE, TWO, ONE], {
        session: { transaction: true },
      });
      expect(result).toHaveLength(2);
      expect(maxActive).toBe(1);
    },
  );
  it("fences a stale FCM edit across suspension and reactivation without restoring old tokens", async () => {
    const { deps, repositories, users } = fixture();
    await deps.services.users.registerFcmToken(actor, { token: "old-token" });
    const original = repositories.users.updateOne.bind(repositories.users);
    let entered;
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    let resume;
    const paused = new Promise((resolve) => {
      resume = resolve;
    });
    let intercepted = false;
    vi.spyOn(repositories.users, "updateOne").mockImplementation(
      async (filter, update, options) => {
        if (!intercepted && update.$set?.fcmTokens?.some((v) => v.token === "new-token")) {
          intercepted = true;
          entered();
          await paused;
        }
        return original(filter, update, options);
      },
    );
    const pending = deps.services.users.registerFcmToken(actor, { token: "new-token" });
    await started;
    await users.operations.suspendUser({
      actor: admin,
      params: { id: USER },
      body: {},
      requestId: "suspend",
    });
    await users.operations.activateUser({
      actor: admin,
      params: { id: USER },
      body: {},
      requestId: "activate",
    });
    resume();
    await pending;
    expect((await deps.services.users.getFcmTokens(USER)).map((v) => v.token)).toEqual([
      "new-token",
    ]);
    const before = await repositories.users.findById(USER);
    await users.operations.deleteMyAccount({ actor, body: {}, requestId: "delete" });
    const after = await repositories.users.findById(USER);
    expect(after.fcmTokens).toEqual([]);
    expect(after.fcmTokensVersion).toBe(before.fcmTokensVersion + 1);
  });
  it.each([true, false])(
    "retains concurrent distinct manual nutrition targets and recalculation (existing=%s)",
    async (existingNutrition) => {
      const { repositories, nutrition } = fixture({ existingNutrition });
      gateTwoReads(repositories.nutritionProfiles, (filter) => filter.userId === USER);
      await Promise.all([
        nutrition.operations.upsertMyNutritionProfile({
          actor,
          body: { dailyCalorieTarget: 2100 },
        }),
        nutrition.operations.upsertMyNutritionProfile({ actor, body: { proteinTargetG: 95 } }),
      ]);
      const persisted = await repositories.nutritionProfiles.findOne({ userId: USER });
      expect(persisted.dailyCalorieTarget).toBe(2100);
      expect(persisted.proteinTargetG).toBe(95);
      expect(persisted.manualTargetFields.sort()).toEqual(["dailyCalorieTarget", "proteinTargetG"]);
      const recalculated = await nutrition.operations.recalculateNutritionTarget({
        actor,
        body: {},
      });
      expect(recalculated.dailyCalorieTarget).toBe(2100);
      expect(recalculated.proteinTargetG).toBe(95);
      expect(await repositories.nutritionProfiles.count({ userId: USER })).toBe(1);
    },
  );
  it("updates legacy nutrition documents missing version by missing-field CAS rather than version0", async () => {
    const { repositories, nutrition } = fixture({ existingNutrition: true });
    const existing = [...repositories.nutritionProfiles.records.values()][0];
    delete existing.version;
    const result = await nutrition.operations.upsertMyNutritionProfile({
      actor,
      body: { dailyCalorieTarget: 2050 },
    });
    expect(result.dailyCalorieTarget).toBe(2050);
    expect((await repositories.nutritionProfiles.findOne({ userId: USER })).version).toBe(1);
  });
});
