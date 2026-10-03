import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { validateDatabaseTestConfig } from "../helpers/database-safety.js";

// No fallback to MONGODB_URI. When not explicitly opted in, even container imports and connect are deferred.
const config = validateDatabaseTestConfig();
const suite = config.enabled ? describe : describe.skip;
suite(
  "real MongoDB canonical persistence (explicit dedicated replica-set DB only)",
  { timeout: 60000 },
  () => {
    const suffix = randomUUID().replaceAll("-", "");
    const tracked = new Map();
    const logger = { info() {}, warn() {}, error() {} };
    let container, lock, owner, admin, targetId;
    const track = (model, id) => {
      const name = model.collection.name;
      if (!tracked.has(name)) tracked.set(name, []);
      tracked.get(name).push(id);
      return id;
    };
    const create = async (model, data) => {
      const document = await model.create(data);
      track(model, document._id);
      return document.toObject();
    };
    const findTrack = async (model, filter) => {
      const rows = await model.find(filter).select("_id").lean();
      for (const row of rows) track(model, row._id);
      return rows;
    };
    beforeAll(async () => {
      const { loadEnv } = await import("../../src/config/env.js");
      const { createContainer } = await import("../../src/container.js");
      const base = loadEnv({ NODE_ENV: "test" });
      const env = {
        ...base,
        ai: { ...base.ai, enabled: true },
        seed: { adminFirebaseUid: `test-seed-${suffix}`, adminEmail: `seed-${suffix}@vegan.test` },
      };
      container = createContainer({
        env,
        logger,
        overrides: {
          authProvider: null,
          storageProvider: null,
          messagingProvider: null,
          aiProvider: {
            enabled: true,
            generate() {
              throw new Error("Real providers forbidden in persistence tests");
            },
          },
        },
      });
      await mongoose.connect(config.uri, {
        dbName: config.database,
        autoIndex: false,
        serverSelectionTimeoutMS: 10000,
      });
      if (mongoose.connection.name !== config.database)
        throw new Error("Connected database differs from validated test name");
      const info = await mongoose.connection.db.admin().command({ hello: 1 });
      if (!info.setName && info.msg !== "isdbgrid")
        throw new Error("A transactional replica set/Atlas deployment is required");
      const collections = await mongoose.connection.db
        .listCollections({}, { nameOnly: true })
        .toArray();
      for (const item of collections)
        if (
          !item.name.startsWith("system.") &&
          (await mongoose.connection.db.collection(item.name).countDocuments({})) > 0
        )
          throw new Error("Test DB must be empty before this run; refusing to touch existing data");
      lock = mongoose.connection.db.collection("_persistenceTestLock");
      await lock.insertOne({ _id: "exclusive", run: suffix });
      for (const model of new Set(Object.values(container.models))) {
        await model.createCollection();
        await model.createIndexes();
      } // Never syncIndexes/drop indexes.
      const users = container.models.users;
      owner = await create(users, {
        firebaseUid: `test-owner-${suffix}`,
        email: `owner-${suffix}@vegan.test`,
        role: "user",
        status: "active",
      });
      admin = await create(users, {
        firebaseUid: `test-admin-${suffix}`,
        email: `admin-${suffix}@vegan.test`,
        role: "admin",
        status: "active",
      });
      targetId = new mongoose.Types.ObjectId();
      await create(container.models.adminGuards, { _id: "active-admins", version: 0 });
    }, 60000);
    afterAll(async () => {
      // Only exact IDs created/tracked by this run are removed. Never dropDatabase or deleteMany({}).
      if (
        mongoose.connection.readyState === 1 &&
        mongoose.connection.name === config.database &&
        lock &&
        (await lock.findOne({ _id: "exclusive", run: suffix }))
      ) {
        for (const [name, ids] of [...tracked.entries()].reverse())
          await mongoose.connection.db.collection(name).deleteMany({ _id: { $in: ids } });
        await lock.deleteOne({ _id: "exclusive", run: suffix });
      }
      await mongoose.disconnect();
    }, 60000);
    it("enforces Firebase UID and engagement/delivery unique indexes on the server", async () => {
      const models = container.models;
      await expect(
        models.users.create({ firebaseUid: owner.firebaseUid, role: "user", status: "active" }),
      ).rejects.toMatchObject({ code: 11000 });
      const cases = [
        ["reactions", { userId: owner._id, targetType: "recipe", targetId, type: "like" }],
        ["savedItems", { userId: owner._id, targetType: "recipe", targetId }],
        ["ratings", { userId: owner._id, targetType: "recipe", targetId, score: 4 }],
        ["viewHistories", { userId: owner._id, targetType: "recipe", targetId }],
        [
          "notifications",
          {
            userId: owner._id,
            title: "Test",
            body: "Test",
            type: "test",
            deliveryKey: `test-${suffix}`,
          },
        ],
        ["aiFeedback", { userId: owner._id, aiRunId: targetId, rating: "helpful" }],
      ];
      for (const [key, data] of cases) {
        await create(models[key], data);
        await expect(models[key].create(data)).rejects.toMatchObject({ code: 11000 });
      }
    });
    it("switches distinct active meal plans through one stable unique owner/week slot", async () => {
      const model = container.models.MealPlansModel;
      const slotModel = container.models.MealPlanActiveSlotsModel;
      const data = {
        userId: owner._id,
        weekStartDate: new Date("2030-01-07T00:00:00Z"),
        title: "Persistence fixture",
        days: [],
        nutritionSummary: {},
        status: "draft",
      };
      const first = await create(model, data);
      const second = await create(model, { ...data, title: "Second fixture" });
      try {
        await container.services.mealPlans.activate(owner._id, String(first._id));
        await container.services.mealPlans.activate(owner._id, String(second._id));
        expect(
          await model.countDocuments({
            userId: owner._id,
            weekStartDate: data.weekStartDate,
            status: "active",
          }),
        ).toBe(1);
        expect((await model.findById(first._id).lean()).status).toBe("archived");
        expect((await model.findById(second._id).lean()).status).toBe("active");
        const slot = await slotModel
          .findOne({ userId: owner._id, weekStartDate: data.weekStartDate })
          .lean();
        expect(String(slot.activePlanId)).toBe(String(second._id));
        expect(
          await slotModel.countDocuments({ userId: owner._id, weekStartDate: data.weekStartDate }),
        ).toBe(1);
        await expect(
          slotModel.create({
            userId: owner._id,
            weekStartDate: data.weekStartDate,
            activePlanId: first._id,
            version: 0,
          }),
        ).rejects.toMatchObject({ code: 11000 });
        expect(
          (await model.collection.listIndexes().toArray()).some(
            (index) => index.name === "one_active_plan_per_owner_week",
          ),
        ).toBe(false);
      } finally {
        await findTrack(slotModel, { userId: owner._id, weekStartDate: data.weekStartDate });
      }
    });
    it("rolls back cross-document writes and refuses removal of the last active admin", async () => {
      const markerId = new mongoose.Types.ObjectId();
      await expect(
        container.transaction(async (session) => {
          await container.repositories.users.create(
            { _id: markerId, firebaseUid: `rollback-${suffix}`, role: "user", status: "active" },
            { session },
          );
          throw new Error("rollback sentinel");
        }),
      ).rejects.toThrow("rollback sentinel");
      expect(await container.models.users.findById(markerId)).toBeNull();
      await expect(
        container.operations.changeUserRole({
          actor: { userId: admin._id, role: "admin" },
          params: { userId: String(admin._id), id: String(admin._id) },
          body: { role: "user" },
        }),
      ).rejects.toMatchObject({ code: "LAST_ADMIN" });
      expect((await container.models.users.findById(admin._id).lean()).role).toBe("admin");
      expect((await container.models.adminGuards.findById("active-admins").lean()).version).toBe(0);
    });
    it("runs canonical seed twice with stable IDs/counts and complete snapshots", async () => {
      const { runSeed, FOOD_FIXTURES, CATEGORY_FIXTURES, ALLERGEN_FIXTURES } =
        await import("../../scripts/seed.js");
      try {
        const first = await runSeed(container, { masterOnly: true, withDemoContent: true });
        const originalIds = (
          await container.models.foodItems
            .find({ slug: { $in: FOOD_FIXTURES.map((food) => food.slug) } })
            .lean()
        )
          .map((food) => String(food._id))
          .sort();
        const second = await runSeed(container, { masterOnly: true, withDemoContent: true });
        expect(first.foodItems.inserted).toBe(20);
        expect(first.recipes.inserted).toBe(8);
        expect(second.foodItems.inserted).toBe(0);
        expect(second.recipes.inserted).toBe(0);
        expect(
          (
            await container.models.foodItems
              .find({ slug: { $in: FOOD_FIXTURES.map((food) => food.slug) } })
              .lean()
          )
            .map((food) => String(food._id))
            .sort(),
        ).toEqual(originalIds);
        const recipes = await container.models.recipes.find({ tags: "demo-fixture" }).lean();
        expect(recipes).toHaveLength(8);
        expect(
          recipes.every((recipe) =>
            recipe.ingredients.every(
              (item) => item.foodNameSnapshot && item.nutritionPer100g.caloriesKcal >= 0,
            ),
          ),
        ).toBe(true);
      } finally {
        await findTrack(container.models.users, { firebaseUid: "internal:vegan-demo-fixtures:v1" });
        await findTrack(container.models.categories, {
          slug: { $in: CATEGORY_FIXTURES.map((item) => item.slug) },
        });
        await findTrack(container.models.allergens, {
          slug: { $in: ALLERGEN_FIXTURES.map((item) => item.slug) },
        });
        await findTrack(container.models.foodItems, {
          slug: { $in: FOOD_FIXTURES.map((item) => item.slug) },
        });
        await findTrack(container.models.recipes, { tags: "demo-fixture" });
      }
    });
    it("retries pantry CAS safely and confirms AI pantry proposal exactly once transactionally", async () => {
      const { FOOD_FIXTURES } = await import("../../scripts/seed.js");
      const category = await create(container.models.categories, {
        name: `Persistence ${suffix}`,
        slug: `persistence-${suffix}`,
        type: "food",
        status: "active",
      });
      const {
        category: ignoredCategory,
        allergenNames: ignoredAllergens,
        ...fixture
      } = FOOD_FIXTURES[0];
      const food = await create(container.models.foodItems, {
        ...fixture,
        name: `Test Broccoli ${suffix}`,
        normalizedName: `test broccoli ${suffix}`,
        slug: `test-broccoli-${suffix}`,
        categoryId: category._id,
        allergenIds: [],
      });
      const actor = { userId: owner._id, role: "user" };
      await container.services.pantries.getForUser(owner._id);
      const pantryModel = container.models.PantriesModel;
      await findTrack(pantryModel, { userId: owner._id });
      await Promise.all([
        container.services.pantries.addItems(owner._id, [
          { foodItemId: String(food._id), quantity: 10, unit: "g" },
        ]),
        container.services.pantries.addItems(owner._id, [
          { foodItemId: String(food._id), quantity: 20, unit: "g" },
        ]),
      ]);
      expect((await pantryModel.findOne({ userId: owner._id }).lean()).items).toHaveLength(2);
      const run = await create(container.models.aiRuns, {
        userId: owner._id,
        feature: "ingredient_recognition",
        status: "completed",
      });
      const proposal = await create(container.models.aiProposals, {
        userId: owner._id,
        aiRunId: run._id,
        type: "pantry",
        status: "pending",
        expiresAt: new Date(Date.now() + 3600000),
        structuredData: {
          items: [{ foodItemId: String(food._id), name: food.name, quantity: 30, unit: "g" }],
        },
      });
      const context = { actor, params: { proposalId: String(proposal._id) }, body: {} };
      const first = await container.operations.confirmPantryProposal(context);
      const second = await container.operations.confirmPantryProposal(context);
      expect(String(second.proposalId)).toBe(String(first.proposalId));
      expect((await pantryModel.findOne({ userId: owner._id }).lean()).items).toHaveLength(3);
      const unresolved = await create(container.models.aiProposals, {
        userId: owner._id,
        aiRunId: run._id,
        type: "pantry",
        status: "pending",
        expiresAt: new Date(Date.now() + 3600000),
        structuredData: { items: [{ name: "Unknown", quantity: 10, unit: "g" }] },
      });
      await expect(
        container.operations.confirmPantryProposal({
          actor,
          params: { proposalId: String(unresolved._id) },
        }),
      ).rejects.toMatchObject({ code: "AI_UNRESOLVED_INGREDIENTS" });
      expect((await container.models.aiProposals.findById(unresolved._id).lean()).status).toBe(
        "pending",
      );
      expect((await pantryModel.findOne({ userId: owner._id }).lean()).items).toHaveLength(3);
    });
  },
);
