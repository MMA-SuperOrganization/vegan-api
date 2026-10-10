import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import {
  CATEGORY_FIXTURES,
  ALLERGEN_FIXTURES,
  FOOD_FIXTURES,
  buildRecipeFixtures,
  hasSeedChanges,
  parseSeedArgs,
  validateAdminConfig,
  runSeed,
  DEMO_AUTHOR_UID,
} from "../../scripts/seed.js";
import {
  parseMigrationArgs,
  planDocumentMigration,
  canonicalMigrationPolicy,
  runMigration,
} from "../../scripts/migrate.js";
import { parseCleanupArgs, pendingCleanupFilter, runCleanup } from "../../scripts/cleanup-media.js";
import { CategoriesModel } from "../../src/modules/categories/categories.model.js";
import { AllergensModel } from "../../src/modules/allergens/allergens.model.js";
import { FoodItemsModel } from "../../src/modules/food-items/food-items.model.js";
import { UsersModel } from "../../src/modules/users/users.model.js";
import { RecipesModel } from "../../src/modules/recipes/recipes.model.js";
import { AiMessageModel } from "../../src/modules/ai/ai.model.js";
import { NUTRIENT_KEYS } from "../../src/common/utils/nutrition.js";
import { fuzzyRegexSource } from "../../src/common/utils/fuzzy-search.js";
const id = () => new mongoose.Types.ObjectId();
const log = () => ({ info: vi.fn(), warn: vi.fn() });
const fixtureContext = () => {
  const categories = Object.fromEntries(CATEGORY_FIXTURES.map((item) => [item.name, id()]));
  const allergens = Object.fromEntries(ALLERGEN_FIXTURES.map((item) => [item.name, id()]));
  const foods = Object.fromEntries(
    FOOD_FIXTURES.map(({ category, allergenNames, ...food }) => [
      food.name,
      {
        ...food,
        _id: id(),
        categoryId: categories[category],
        allergenIds: allergenNames.map((name) => allergens[name]),
      },
    ]),
  );
  return { categories, allergens, foods, authorId: id() };
};
function fakeModel(actual) {
  const records = new Map();
  return class Model extends actual {
    static collection = { name: actual.collection.name };
    static records = records;
    static findOne(filter) {
      return {
        lean: async () =>
          [...records.values()].find((row) =>
            Object.entries(filter).every(([key, value]) => String(row[key]) === String(value)),
          ) ?? null,
      };
    }
    static async updateOne(filter, update) {
      const existing = await this.findOne(filter).lean();
      const row = new actual({ ...existing, ...update.$set, _id: existing?._id ?? id() });
      await row.validate();
      records.set(String(row._id), row.toObject());
      return { upsertedCount: existing ? 0 : 1, modifiedCount: existing ? 1 : 0 };
    }
  };
}
describe("offline maintenance scripts", () => {
  it("exports 40 canonical foods and 20 complete recipe snapshots without database imports/connection", async () => {
    expect(mongoose.connection.readyState).toBe(0);
    expect(CATEGORY_FIXTURES).toHaveLength(12);
    expect(ALLERGEN_FIXTURES).toHaveLength(5);
    expect(FOOD_FIXTURES).toHaveLength(40);
    const context = fixtureContext();
    for (const food of Object.values(context.foods)) {
      await new FoodItemsModel(food).validate();
      expect(Object.keys(food.nutritionPer100g)).toEqual(NUTRIENT_KEYS);
      expect(food.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
    }
    const recipes = buildRecipeFixtures(context);
    expect(recipes).toHaveLength(20);
    expect(new Set(recipes.map((row) => row.slug)).size).toBe(20);
    for (const recipe of recipes) {
      await new RecipesModel(recipe).validate();
      expect(recipe.coverImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(recipe).not.toHaveProperty("viewCount");
      expect(recipe).not.toHaveProperty("version");
      expect(
        recipe.ingredients.every(
          (item) =>
            item.foodNameSnapshot &&
            item.gramEquivalent === item.quantity &&
            Object.keys(item.nutritionPer100g).length === 11,
        ),
      ).toBe(true);
      expect(recipe.steps.map((item) => item.order)).toEqual(recipe.steps.map((_, i) => i + 1));
    }
    expect(recipes[0].nutritionPerServing.caloriesKcal).toBeCloseTo(211.6);
    expect(recipes.find((row) => row.slug === "tofu-scramble").allergenIds).toHaveLength(1);
    const tofu = FOOD_FIXTURES.find((food) => food.name === "Tofu");
    expect(tofu.aliases).toEqual(expect.arrayContaining(["đậu hũ", "đậu phụ"]));
    expect(new RegExp(fuzzyRegexSource("dau hu"), "i").test(tofu.aliases.join(" "))).toBe(true);
  });
  it("requires explicit safe seed mode and real admin configuration", () => {
    expect(() =>
      validateAdminConfig({ adminFirebaseUid: "CHANGE_ME", adminEmail: "admin@example.com" }),
    ).toThrow();
    expect(() =>
      validateAdminConfig({ adminFirebaseUid: DEMO_AUTHOR_UID, adminEmail: "real@vegan.test" }),
    ).toThrow();
    expect(
      validateAdminConfig({ adminFirebaseUid: "real-firebase-uid", adminEmail: "REAL@vegan.test" }),
    ).toEqual({ firebaseUid: "real-firebase-uid", email: "real@vegan.test" });
    expect(() => parseSeedArgs(["--with-demo-content"])).toThrow();
    expect(() => parseSeedArgs(["--force"])).toThrow();
    expect(parseSeedArgs(["--master-only", "--with-demo-content"])).toMatchObject({
      masterOnly: true,
      withDemoContent: true,
    });
  });
  it("compares only canonical seed fields and normalizes Mongo values", () => {
    const objectId = id();
    const publishedAt = new Date("2025-01-01T00:00:00.000Z");
    const existing = {
      _id: id(),
      categoryId: objectId,
      publishedAt,
      title: "Demo",
      updatedAt: new Date(),
    };
    expect(
      hasSeedChanges(existing, {
        categoryId: objectId.toHexString(),
        publishedAt: publishedAt.toISOString(),
        title: "Demo",
      }),
    ).toBe(false);
    expect(hasSeedChanges(existing, { title: "Updated demo" })).toBe(true);
  });
  it("seeds canonical fake models idempotently and skips admin/recipes in master-only mode", async () => {
    const models = Object.fromEntries(
      Object.entries({
        users: UsersModel,
        categories: CategoriesModel,
        allergens: AllergensModel,
        foodItems: FoodItemsModel,
        recipes: RecipesModel,
      }).map(([key, model]) => [key, fakeModel(model)]),
    );
    const container = { models, env: { seed: {} }, logger: log() };
    const first = await runSeed(container, { masterOnly: true });
    expect(first.foodItems.inserted).toBe(40);
    expect(models.users.records.size).toBe(0);
    expect(models.recipes.records.size).toBe(0);
    const second = await runSeed(container, { masterOnly: true });
    expect(second.foodItems.inserted).toBe(0);
    expect(second.foodItems.updated).toBe(0);
    expect(second.foodItems.unchanged).toBe(40);
    expect(models.foodItems.records.size).toBe(40);
    await runSeed(container, { masterOnly: true, withDemoContent: true });
    await runSeed(container, { masterOnly: true, withDemoContent: true });
    expect(models.users.records.size).toBe(1);
    expect(models.recipes.records.size).toBe(20);
    expect([...models.users.records.values()][0].role).toBe("user");
    expect(
      [...models.recipes.records.values()].every((recipe) => recipe.sourceType === "community"),
    ).toBe(true);
  });
  it("migration defaults read-only and rejects ambiguous changes", () => {
    expect(parseMigrationArgs([]).apply).toBe(false);
    expect(parseMigrationArgs(["--apply"]).apply).toBe(true);
    expect(() => parseMigrationArgs(["--apply", "--dry-run"])).toThrow();
    const plan = planDocumentMigration(
      { _id: "keep-id", role: "ADMIN", status: "ACTIVE" },
      {
        roleValues: ["user", "admin"],
        statusValues: ["active", "suspended", "deleted"],
        hasVersion: true,
      },
    );
    expect(plan.set).toEqual({ role: "admin", status: "active", version: 0 });
    expect(plan.filter.version).toEqual({ $exists: false });
    expect(plan.filter._id).toBe("keep-id");
    expect(
      planDocumentMigration(
        { role: "SUPER_ADMIN", status: "maybe", version: -1 },
        { roleValues: ["user", "admin"], statusValues: ["active"], hasVersion: true },
      ).conflicts,
    ).toHaveLength(3);
    expect(
      planDocumentMigration(
        { status: "active", isActive: false },
        { statusValues: ["active", "inactive"] },
      ).conflicts,
    ).toHaveLength(1);
    expect(
      planDocumentMigration({ isActive: false }, { statusValues: ["active", "inactive"] }).set,
    ).toEqual({ status: "inactive" });
    expect(canonicalMigrationPolicy(AiMessageModel).roleValues).toEqual([]); // 'assistant' is not an account role.
  });
  it("migration inventories without writes and applies only an explicit fenced transaction", async () => {
    const doc = { _id: "keep-id", firebaseUid: "uid", role: "ADMIN", status: "ACTIVE" };
    const updateOne = vi.fn(async () => ({ matchedCount: 1, modifiedCount: 1 }));
    const collection = {
      find: () => ({ limit: () => ({ toArray: async () => [doc] }) }),
      updateOne,
    };
    const session = { withTransaction: vi.fn(async (work) => work()), endSession: vi.fn() };
    const connection = {
      db: {
        listCollections: () => ({ toArray: async () => [{ name: "users" }] }),
        collection: () => collection,
      },
      startSession: vi.fn(async () => session),
    };
    const container = {
      models: {
        users: { schema: UsersModel.schema, collection: { name: "users" }, db: connection },
      },
      logger: log(),
    };
    expect((await runMigration(container)).planned).toBe(1);
    expect(updateOne).not.toHaveBeenCalled();
    expect(connection.startSession).not.toHaveBeenCalled();
    expect((await runMigration(container, { apply: true })).applied).toBe(1);
    expect(session.withTransaction).toHaveBeenCalledOnce();
    expect(updateOne.mock.calls[0][0]).toMatchObject({
      _id: "keep-id",
      role: "ADMIN",
      status: "ACTIVE",
    });
    expect(updateOne.mock.calls[0][1]).toEqual({ $set: { role: "admin", status: "active" } });
    doc.status = "unknown";
    updateOne.mockClear();
    await expect(runMigration(container, { apply: true })).rejects.toThrow("Apply refused");
    expect(updateOne).not.toHaveBeenCalled();
  });
  it("cleanup CLI delegates explicit owner scope to the canonical service", async () => {
    expect(parseCleanupArgs([])).toMatchObject({ apply: false, limit: 50, olderThanHours: 24 });
    expect(() => parseCleanupArgs(["--older-than-hours", "1"])).toThrow();
    expect(() => parseCleanupArgs(["--apply", "--dry-run"])).toThrow();
    expect(() => parseCleanupArgs(["--owner-id", "invalid"])).toThrow();
    expect(() => parseCleanupArgs(["--owner-id", String(id()), "--all-owners"])).toThrow();
    const administrator = id(),
      owner = id();
    const cleanupPending = vi.fn(async () => ({ mode: "dry-run", deleted: 0 }));
    const container = {
      env: { seed: { adminFirebaseUid: "real-uid" } },
      logger: log(),
      repositories: { users: { findOne: vi.fn(async () => ({ _id: administrator })) } },
      services: { media: { cleanupPending } },
    };
    await runCleanup(container, { ownerId: String(owner), apply: false });
    expect(cleanupPending).toHaveBeenCalledWith({
      ownerId: String(owner),
      apply: false,
      actor: { userId: administrator, role: "admin", status: "active" },
    });
    const filter = pendingCleanupFilter({ ownerId: owner });
    expect(filter.ownerId).toBe(owner);
    expect(filter.status.$in).toEqual(["pending", "rejected", "deleting"]);
    expect(filter["references.0"]).toEqual({ $exists: false });
  });
  it("migration refuses legacy active-plan indexes and missing stable slots without writes", async () => {
    const plan = {
      _id: id(),
      userId: id(),
      weekStartDate: new Date("2030-01-07T00:00:00Z"),
      status: "active",
      version: 0,
    };
    const updateOne = vi.fn();
    const collection = {
      listIndexes: () => ({ toArray: async () => [{ name: "one_active_plan_per_owner_week" }] }),
      find: () => ({ limit: () => ({ toArray: async () => [plan] }) }),
      updateOne,
    };
    const connection = {
      db: {
        listCollections: () => ({ toArray: async () => [{ name: "mealplans" }] }),
        collection: () => collection,
      },
      startSession: vi.fn(),
    };
    const model = {
      collection: { name: "mealplans" },
      schema: {
        path: (key) =>
          key === "status"
            ? { enumValues: ["draft", "active", "archived"] }
            : key === "version"
              ? {}
              : null,
        requiredPaths: () => [],
      },
      db: connection,
    };
    const container = { models: { MealPlansModel: model }, logger: log() };
    const report = await runMigration(container);
    expect(report.manualReview).toBe(2);
    expect(report.collections[0].observations.map((item) => item.reason).join(" ")).toMatch(
      /partial active-plan index.*stable owner\/week pointer/,
    );
    await expect(runMigration(container, { apply: true })).rejects.toThrow("Apply refused");
    expect(updateOne).not.toHaveBeenCalled();
    expect(connection.startSession).not.toHaveBeenCalled();
  });
});
