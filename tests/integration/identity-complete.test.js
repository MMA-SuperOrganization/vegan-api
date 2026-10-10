import { describe, it, expect, vi } from "vitest";
import { createUsersModule } from "../../src/modules/users/index.js";
import { createAuthModule } from "../../src/modules/auth/index.js";
import { createNutritionProfilesModule } from "../../src/modules/nutrition-profiles/index.js";
import { createOnboardingModule } from "../../src/modules/onboarding/index.js";
import { createCategoriesModule } from "../../src/modules/categories/index.js";
import { createAllergensModule } from "../../src/modules/allergens/index.js";
import { createFoodItemsModule } from "../../src/modules/food-items/index.js";
import { apiManifest } from "../../src/routes/api-manifest.js";

const USER = "111111111111111111111111";
const ADMIN = "222222222222222222222222";
const OTHER = "333333333333333333333333";
const CATEGORY = "444444444444444444444444";
const ALLERGEN = "555555555555555555555555";
const FOOD = "666666666666666666666666";
const clone = (value) => structuredClone(value);
const values = (doc, path) =>
  path
    .split(".")
    .reduce(
      (items, key) =>
        items.flatMap((v) => (Array.isArray(v) ? v.map((item) => item?.[key]) : [v?.[key]])),
      [doc],
    )
    .flat();
const matches = (doc, filter) =>
  Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((entry) => matches(doc, entry));
    const actual = values(doc, key);
    if (
      expected &&
      typeof expected === "object" &&
      !Array.isArray(expected) &&
      !(expected instanceof Date)
    ) {
      return Object.entries(expected).every(([op, value]) => {
        if (op === "$ne") return !actual.some((v) => String(v) === String(value));
        if (op === "$in") return actual.some((v) => value.map(String).includes(String(v)));
        if (op === "$nin") return !actual.some((v) => value.map(String).includes(String(v)));
        if (op === "$regex")
          return actual.some((v) => new RegExp(value, expected.$options).test(v ?? ""));
        if (op === "$options") return true;
        if (op === "$exists") return actual.some((v) => v !== undefined) === value;
        return false;
      });
    }
    if (Array.isArray(expected)) return JSON.stringify(doc[key] ?? []) === JSON.stringify(expected);
    return actual.some((v) => String(v) === String(expected));
  });
const memory = (seed = [], unique = []) => {
  let sequence = 100;
  const rows = seed.map(clone);
  const ensureUnique = (record, ignore) => {
    for (const key of unique)
      if (
        record[key] !== undefined &&
        rows.some((v) => v._id !== ignore && String(v[key]) === String(record[key]))
      )
        throw Object.assign(new Error("duplicate"), { code: 11000 });
  };
  return {
    rows,
    async findOne(filter) {
      return clone(rows.find((doc) => matches(doc, filter)) ?? null);
    },
    async findById(id) {
      return this.findOne({ _id: id });
    },
    async findMany(filter, options = {}) {
      const all = rows.filter((v) => matches(v, filter));
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      return {
        data: clone(all.slice((page - 1) * limit, page * limit)),
        meta: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
      };
    },
    async create(data) {
      const record = {
        _id: (++sequence).toString(16).padStart(24, "0"),
        createdAt: new Date("2026-10-03"),
        ...clone(data),
      };
      ensureUnique(record);
      rows.push(record);
      return clone(record);
    },
    async updateOne(filter, update, options = {}) {
      let current = rows.find((v) => matches(v, filter));
      const inserted = !current;
      if (!current && !options.upsert) return null;
      if (!current)
        current = {
          _id: (++sequence).toString(16).padStart(24, "0"),
          ...Object.fromEntries(Object.entries(filter).filter(([, v]) => typeof v !== "object")),
        };
      const after = clone(current);
      if (inserted) Object.assign(after, clone(update.$setOnInsert ?? {}));
      Object.assign(after, clone(update.$set ?? {}));
      for (const key of Object.keys(update.$unset ?? {})) delete after[key];
      for (const [key, value] of Object.entries(update.$inc ?? {}))
        after[key] = (after[key] ?? 0) + value;
      for (const [key, value] of Object.entries(update.$pull ?? {}))
        after[key] = (after[key] ?? []).filter((v) => !matches(v, value));
      ensureUnique(after, current._id);
      if (inserted) rows.push(after);
      else Object.assign(current, after);
      return clone(after);
    },
    async count(filter) {
      return rows.filter((v) => matches(v, filter)).length;
    },
    async deleteOne(filter) {
      const index = rows.findIndex((v) => matches(v, filter));
      return index === -1 ? null : rows.splice(index, 1)[0];
    },
    async aggregate() {
      return [];
    },
  };
};
const fixture = ({ transaction } = {}) => {
  const repositories = {
    users: memory(
      [
        {
          _id: USER,
          firebaseUid: "uid-user",
          email: "user@example.com",
          displayName: "User",
          role: "user",
          status: "active",
          onboardingCompleted: false,
          fcmTokens: [],
        },
        { _id: ADMIN, firebaseUid: "uid-admin", role: "admin", status: "active", fcmTokens: [] },
        { _id: OTHER, firebaseUid: "uid-other", role: "user", status: "active", fcmTokens: [] },
      ],
      ["firebaseUid"],
    ),
    userProfiles: memory([], ["userId"]),
    nutritionProfiles: memory([], ["userId"]),
    adminGuards: memory(),
    categories: memory(
      [{ _id: CATEGORY, name: "Beans", slug: "beans", type: "food", status: "active" }],
      ["slug"],
    ),
    allergens: memory([{ _id: ALLERGEN, name: "Soy", slug: "soy", status: "active" }], ["slug"]),
    foodItems: memory(
      [
        {
          _id: FOOD,
          name: "Tofu",
          normalizedName: "tofu",
          aliases: ["đậu hũ"],
          slug: "tofu",
          imageUrl: "https://images.test/tofu.jpg",
          categoryId: CATEGORY,
          isVegan: true,
          isVegetarian: true,
          status: "active",
          allergenIds: [ALLERGEN],
          nutritionPer100g: { caloriesKcal: 120 },
          defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
        },
      ],
      ["slug"],
    ),
    recipes: memory([
      { _id: "777777777777777777777777", authorId: USER, status: "draft", title: "Mine" },
      { _id: "888888888888888888888888", authorId: OTHER, status: "draft", title: "Private other" },
    ]),
  };
  const audit = { record: vi.fn(async () => {}) };
  const deps = {
    repositories,
    services: {},
    clock: () => new Date("2026-10-03T12:00:00Z"),
    audit,
    transaction:
      transaction ??
      (async (work) => {
        const snapshot = Object.fromEntries(
          Object.entries(repositories).map(([key, repo]) => [key, clone(repo.rows)]),
        );
        try {
          return await work({ test: true });
        } catch (error) {
          for (const [key, rows] of Object.entries(snapshot))
            repositories[key].rows.splice(0, Infinity, ...rows);
          throw error;
        }
      }),
  };
  const modules = Object.fromEntries(
    [
      ["users", createUsersModule],
      ["auth", createAuthModule],
      ["nutrition-profiles", createNutritionProfilesModule],
      ["onboarding", createOnboardingModule],
      ["categories", createCategoriesModule],
      ["allergens", createAllergensModule],
      ["food-items", createFoodItemsModule],
    ].map(([key, factory]) => {
      const module = factory(deps);
      Object.assign(deps.services, module.services);
      return [key, module];
    }),
  );
  const call = async (module, operation, input = {}) => {
    const schema = modules[module].validation[operation];
    const context = {
      actor: { userId: USER, firebaseUid: "uid-user", role: "user", status: "active" },
      body: {},
      query: {},
      params: {},
      requestId: "test-request",
      ...input,
    };
    for (const key of ["body", "params", "query"])
      if (schema[key]) context[key] = schema[key].parse(context[key]);
    return modules[module].operations[operation](context);
  };
  return {
    repositories,
    modules,
    deps,
    audit,
    call,
    admin: { userId: ADMIN, firebaseUid: "uid-admin", role: "admin", status: "active" },
  };
};

describe("complete identity, nutrition, onboarding and master domain contracts", () => {
  it("implements every assigned manifest operation and validation", () => {
    const { modules } = fixture();
    for (const entry of apiManifest.filter((v) => modules[v.module])) {
      expect(modules[entry.module].operations[entry.operationId]).toBeTypeOf("function");
      expect(modules[entry.module].validation[entry.operationId]).toBeDefined();
    }
  });
  it("synchronizes Firebase UID idempotently without accepting privilege claims", async () => {
    const { call, repositories } = fixture();
    const actor = {
      firebaseUid: "uid-new",
      email: "New@Example.com",
      name: "New user",
      role: "admin",
      status: "active",
    };
    const results = await Promise.all([
      call("auth", "syncAuth", { actor }),
      call("auth", "syncAuth", { actor }),
    ]);
    expect(results[0].userId).toBe(results[1].userId);
    expect(results[0].role).toBe("user");
    expect(results[0].email).toBe("new@example.com");
    expect(repositories.users.rows.filter((v) => v.firebaseUid === "uid-new")).toHaveLength(1);
  });
  it("resolves only active synchronized identities without leaking account fields", async () => {
    const { deps, repositories } = fixture();
    expect(await deps.services.users.resolveIdentity({ firebaseUid: "uid-user" })).toEqual({
      userId: USER,
      firebaseUid: "uid-user",
      role: "user",
      status: "active",
    });
    await expect(
      deps.services.users.resolveIdentity({ firebaseUid: "absent" }),
    ).rejects.toMatchObject({ code: "ACCOUNT_NOT_SYNCED" });
    repositories.users.rows[0].status = "suspended";
    await expect(deps.services.users.resolveIdentity("uid-user")).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(
      deps.services.users.syncAccount({ firebaseUid: "uid-user" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  it("rejects account/profile mass assignment and invalid IDs", async () => {
    const { call } = fixture();
    await expect(call("users", "updateMyProfile", { body: { role: "admin" } })).rejects.toThrow();
    await expect(
      call("users", "upsertMyProfile", { body: { userId: OTHER, bio: "x" } }),
    ).rejects.toThrow();
    await expect(
      call("users", "getPublicUserProfile", { params: { userId: "bad" } }),
    ).rejects.toThrow();
    await expect(call("auth", "syncAuth", { body: { role: "admin" } })).rejects.toThrow();
  });
  it("keeps public profile separate from private demographics, email and health", async () => {
    const { call, repositories } = fixture();
    await call("users", "upsertMyProfile", {
      body: {
        bio: "Plant enthusiast",
        dateOfBirth: "1995-05-06",
        gender: "female",
        dietType: "vegan",
      },
    });
    await call("nutrition-profiles", "upsertMyNutritionProfile", {
      body: { medicalNotes: "Private condition", allergenIds: [ALLERGEN] },
    });
    const result = await call("users", "getPublicUserProfile", {
      params: { userId: USER },
      actor: null,
    });
    expect(result).toMatchObject({ userId: USER, bio: "Plant enthusiast", dietType: "vegan" });
    for (const field of [
      "email",
      "role",
      "dateOfBirth",
      "gender",
      "medicalNotes",
      "nutritionProfile",
      "fcmTokens",
      "firebaseUid",
    ])
      expect(result).not.toHaveProperty(field);
    repositories.users.rows[0].status = "suspended";
    await expect(
      call("users", "getPublicUserProfile", { params: { userId: USER }, actor: null }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it("scopes created content and activity to its owner", async () => {
    const { call } = fixture();
    const result = await call("users", "getMyContent", { query: { type: "recipe" } });
    expect(result.data.map((v) => v.title)).toEqual(["Mine"]);
    const activity = await call("users", "getMyActivity");
    expect(activity.counts.recipes).toBe(1);
  });
  it("makes token registration and removal idempotent and never exposes token", async () => {
    const { call, deps } = fixture();
    const one = await call("auth", "addFcmToken", { body: { token: "secret-device-token" } });
    const two = await call("auth", "addFcmToken", {
      body: { token: "secret-device-token", deviceName: "Pixel" },
    });
    expect(one.tokenId).toBe(two.tokenId);
    expect(two).not.toHaveProperty("token");
    expect(await deps.services.users.getFcmTokens(USER)).toHaveLength(1);
    expect(JSON.stringify(await call("auth", "getMe"))).not.toContain("secret-device-token");
    await call("auth", "removeFcmToken", { params: { tokenId: one.tokenId } });
    await call("auth", "removeFcmToken", { params: { tokenId: one.tokenId } });
    expect(await deps.services.users.getFcmTokens(USER)).toHaveLength(0);
  });
  it("does not permit registering the same device token to another account", async () => {
    const { call } = fixture();
    await call("auth", "addFcmToken", { body: { token: "device-token" } });
    await expect(
      call("auth", "addFcmToken", {
        actor: { userId: OTHER, role: "user", status: "active" },
        body: { token: "device-token" },
      }),
    ).rejects.toMatchObject({ code: "FCM_TOKEN_CONFLICT" });
  });
  it("soft-deletes account, clears tokens, and cannot sync it back", async () => {
    const { call, repositories, deps } = fixture();
    await call("auth", "addFcmToken", { body: { token: "private-token" } });
    expect(await call("users", "deleteMyAccount")).toMatchObject({ status: "deleted" });
    expect(repositories.users.rows[0].fcmTokens).toEqual([]);
    await expect(
      deps.services.users.syncAccount({ firebaseUid: "uid-user" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  it("never assumes age or sex for calorie targets or adult BMI categories", async () => {
    const { call } = fixture();
    const result = await call("nutrition-profiles", "upsertMyNutritionProfile", {
      body: { heightCm: 170, currentWeightKg: 65, goal: "maintain", activityLevel: "moderate" },
    });
    expect(result.bmi).toBeCloseTo(22.5, 1);
    expect(result.dailyCalorieTarget).toBeUndefined();
    expect(result.bmiCategory).toBeUndefined();
    expect(result.targetSource).toBe("insufficient_data");
    expect(result.disclaimer).toContain("not a diagnosis");
  });
  it("calculates adult estimates and preserves explicitly supplied targets on recalculation", async () => {
    const { call } = fixture();
    await call("users", "upsertMyProfile", {
      body: { dateOfBirth: "1995-01-01", gender: "female" },
    });
    const result = await call("nutrition-profiles", "upsertMyNutritionProfile", {
      body: {
        heightCm: 170,
        currentWeightKg: 65,
        goal: "maintain",
        activityLevel: "moderate",
        dailyCalorieTarget: 2100,
      },
    });
    expect(result.dailyCalorieTarget).toBe(2100);
    expect(result.bmiCategory).toBe("normal");
    expect(result.proteinTargetG).toBeGreaterThan(0);
    expect(
      (await call("nutrition-profiles", "recalculateNutritionTarget")).dailyCalorieTarget,
    ).toBe(2100);
  });
  it("disables automated calorie advice for minors and medical notes", async () => {
    const { call } = fixture();
    await call("users", "upsertMyProfile", { body: { dateOfBirth: "2015-01-01", gender: "male" } });
    const result = await call("nutrition-profiles", "upsertMyNutritionProfile", {
      body: { heightCm: 140, currentWeightKg: 40, goal: "lose_weight", activityLevel: "active" },
    });
    expect(result.dailyCalorieTarget).toBeUndefined();
    expect(result.bmiCategory).toBeUndefined();
  });
  it("validates food/allergen foreign references before profile persistence", async () => {
    const { call, repositories } = fixture();
    await expect(
      call("users", "upsertMyProfile", {
        body: { dislikedFoodItemIds: ["aaaaaaaaaaaaaaaaaaaaaaaa"] },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      call("nutrition-profiles", "upsertMyNutritionProfile", {
        body: { allergenIds: ["aaaaaaaaaaaaaaaaaaaaaaaa"] },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(repositories.userProfiles.rows).toHaveLength(0);
    expect(repositories.nutritionProfiles.rows).toHaveLength(0);
  });
  it("requires explicit allergen selection then completes onboarding idempotently", async () => {
    const { call } = fixture();
    await expect(call("onboarding", "completeOnboarding")).rejects.toMatchObject({
      code: "ONBOARDING_INCOMPLETE",
    });
    await call("onboarding", "updateOnboarding", {
      body: { dietType: "vegan", goal: "maintain", activityLevel: "light" },
    });
    expect((await call("onboarding", "getOnboardingStatus")).missingFields).toEqual([
      "allergenIds",
    ]);
    await call("onboarding", "updateOnboarding", { body: { allergenIds: [] } });
    expect((await call("onboarding", "completeOnboarding")).completed).toBe(true);
    expect((await call("onboarding", "completeOnboarding")).completed).toBe(true);
  });
  it("persists onboarding idempotently when MongoDB transactions are unavailable", async () => {
    const transactionUnavailable = async () => {
      const error = new Error("This operation requires a MongoDB replica set");
      error.code = "TRANSACTIONS_REQUIRED";
      throw error;
    };
    const { call } = fixture({ transaction: transactionUnavailable });
    await call("onboarding", "updateOnboarding", {
      body: {
        dietType: "vegan",
        goal: "maintain",
        activityLevel: "light",
        allergenIds: [],
      },
    });
    expect((await call("onboarding", "completeOnboarding")).completed).toBe(true);
  });
  it("deletes a regular account when the MongoDB transaction attempt is rejected", async () => {
    const transactionUnavailable = async () => {
      const error = new Error("This operation requires a MongoDB replica set");
      error.code = "TRANSACTIONS_REQUIRED";
      throw error;
    };
    const { call, repositories } = fixture({ transaction: transactionUnavailable });
    expect(await call("users", "deleteMyAccount")).toMatchObject({
      status: "deleted",
    });
    expect(await repositories.users.findById(USER)).toMatchObject({
      status: "deleted",
      onboardingCompleted: false,
      avatarMediaId: null,
    });
  });
  it("rolls back onboarding step if a nutrition reference is invalid", async () => {
    const { call, repositories } = fixture();
    await expect(
      call("onboarding", "updateOnboarding", {
        body: { dietType: "vegan", allergenIds: ["aaaaaaaaaaaaaaaaaaaaaaaa"] },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(repositories.userProfiles.rows).toHaveLength(0);
  });
  it("prevents removing the last active administrator through role, suspension and deletion", async () => {
    const { call, admin } = fixture();
    await expect(
      call("users", "changeUserRole", {
        actor: admin,
        params: { id: ADMIN },
        body: { role: "user" },
      }),
    ).rejects.toMatchObject({ code: "LAST_ADMIN" });
    await expect(
      call("users", "suspendUser", { actor: admin, params: { id: ADMIN } }),
    ).rejects.toMatchObject({ code: "LAST_ADMIN" });
    await expect(call("users", "deleteMyAccount", { actor: admin })).rejects.toMatchObject({
      code: "LAST_ADMIN",
    });
  });
  it("serializes concurrent last-admin decisions and audits accepted mutation", async () => {
    const { call, admin, audit, repositories } = fixture();
    await call("users", "changeUserRole", {
      actor: admin,
      params: { id: OTHER },
      body: { role: "admin" },
    });
    const otherAdmin = { userId: OTHER, role: "admin", status: "active" };
    const results = await Promise.allSettled([
      call("users", "changeUserRole", {
        actor: admin,
        params: { id: ADMIN },
        body: { role: "user" },
      }),
      call("users", "changeUserRole", {
        actor: otherAdmin,
        params: { id: OTHER },
        body: { role: "user" },
      }),
    ]);
    expect(results.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect(
      repositories.users.rows.filter((v) => v.role === "admin" && v.status === "active"),
    ).toHaveLength(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.role.change",
        requestId: "test-request",
        session: { test: true },
      }),
      expect.anything(),
    );
  });
  it("audits master writes and inactivates rather than deleting historical references", async () => {
    const { call, admin, repositories, audit } = fixture();
    const created = await call("categories", "createCategory", {
      actor: admin,
      body: { name: "Fruit", type: "food" },
    });
    expect(created.slug).toBe("fruit");
    await call("food-items", "deleteFoodItem", { actor: admin, params: { id: FOOD } });
    expect(repositories.foodItems.rows[0].status).toBe("inactive");
    expect(repositories.foodItems.rows).toHaveLength(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "foodItem.inactivate",
        targetId: FOOD,
        before: expect.any(Object),
        after: expect.any(Object),
      }),
    );
    await expect(call("food-items", "getFoodItem", { params: { id: FOOD } })).rejects.toMatchObject(
      { statusCode: 404 },
    );
  });
  it("rejects master empty patches, duplicates, unauthorized writes and invalid references", async () => {
    const { call, admin } = fixture();
    await expect(
      call("categories", "updateCategory", { actor: admin, params: { id: CATEGORY }, body: {} }),
    ).rejects.toThrow();
    await expect(
      call("allergens", "updateAllergen", { actor: admin, params: { id: ALLERGEN }, body: {} }),
    ).rejects.toThrow();
    await expect(
      call("categories", "createCategory", { actor: admin, body: { name: "Beans", type: "food" } }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      call("categories", "createCategory", { body: { name: "Unauthorized", type: "food" } }),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      call("food-items", "updateFoodItem", {
        actor: admin,
        params: { id: FOOD },
        body: { categoryId: "aaaaaaaaaaaaaaaaaaaaaaaa" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it("filters active food search, excludes allergens, escapes regex and bounds sort", async () => {
    const { call, repositories } = fixture();
    repositories.foodItems.rows.push({
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Hidden",
      normalizedName: "hidden",
      status: "inactive",
    });
    expect((await call("food-items", "searchFoodItems")).data.map((v) => v.name)).toEqual(["Tofu"]);
    expect(
      (await call("food-items", "searchFoodItems", { query: { q: "toffu" } })).data[0],
    ).toMatchObject({ name: "Tofu", imageUrl: "https://images.test/tofu.jpg" });
    expect(
      (await call("food-items", "searchFoodItems", { query: { q: "dau hu" } })).data[0],
    ).toMatchObject({ name: "Tofu" });
    expect(
      (await call("food-items", "searchFoodItems", { query: { excludeAllergenIds: ALLERGEN } }))
        .data,
    ).toEqual([]);
    expect((await call("food-items", "searchFoodItems", { query: { q: ".*" } })).data).toEqual([]);
    await expect(
      call("food-items", "searchFoodItems", { query: { sort: "$where" } }),
    ).rejects.toThrow();
    await expect(
      call("food-items", "searchFoodItems", { query: { limit: 101 } }),
    ).rejects.toThrow();
  });
});
