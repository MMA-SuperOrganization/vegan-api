import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp, TEST_IDS, TEST_TOKENS, bearer } from "../helpers/test-app.js";
import { apiManifest } from "../../src/routes/api-manifest.js";

const CATEGORY = "200000000000000000000001";
const ALLERGEN = "200000000000000000000002";
const FOOD = "200000000000000000000003";
const MISSING = "ffffffffffffffffffffffff";
const fixture = () =>
  buildTestApp({
    seed: {
      categories: [
        {
          _id: CATEGORY,
          name: "Beans",
          slug: "beans",
          type: "food",
          status: "active",
          sortOrder: 3,
        },
      ],
      allergens: [{ _id: ALLERGEN, name: "Soy", slug: "soy", status: "active" }],
      foodItems: [
        {
          _id: FOOD,
          name: "Tofu",
          normalizedName: "tofu",
          slug: "tofu",
          categoryId: CATEGORY,
          isVegan: true,
          isVegetarian: true,
          status: "active",
          allergenIds: [ALLERGEN],
          defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
          nutritionPer100g: { caloriesKcal: 120 },
        },
      ],
      userProfiles: [
        {
          userId: TEST_IDS.user,
          bio: "Private profile owner",
          dietType: "vegan",
          dateOfBirth: "1995-01-01",
          gender: "female",
        },
      ],
      nutritionProfiles: [
        {
          userId: TEST_IDS.user,
          heightCm: 170,
          currentWeightKg: 65,
          activityLevel: "moderate",
          goal: "maintain",
          allergenIds: [],
          allergenSelectionCompleted: true,
        },
      ],
    },
  });
const foodBody = {
  name: "Lentils",
  categoryId: CATEGORY,
  isVegan: true,
  isVegetarian: true,
  defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
  nutritionPer100g: { caloriesKcal: 116, proteinG: 9 },
  allergenIds: [],
};
const bodyByOperation = {
  updateMyProfile: { displayName: "Fresh name" },
  upsertMyProfile: { bio: "Updated biography", dietType: "vegan" },
  upsertMyNutritionProfile: {
    heightCm: 171,
    currentWeightKg: 65,
    activityLevel: "moderate",
    goal: "maintain",
  },
  updateOnboarding: {
    dietType: "vegan",
    allergenIds: [],
    goal: "maintain",
    activityLevel: "moderate",
  },
  createCategory: { name: "Fruit", type: "food" },
  updateCategory: { description: "Updated category" },
  createAllergen: { name: "Peanut" },
  updateAllergen: { description: "Updated allergen" },
  createFoodItem: foodBody,
  updateFoodItem: { name: "Fresh tofu" },
  changeUserRole: { role: "admin" },
  addFcmToken: { token: "fake-device-token", deviceName: "Pixel" },
};
const assigned = apiManifest.filter((entry) =>
  [
    "users",
    "auth",
    "nutrition-profiles",
    "onboarding",
    "categories",
    "allergens",
    "food-items",
  ].includes(entry.module),
);
const pathFor = (entry, ids = {}) =>
  "/api/v1" +
  entry.path
    .replace(":userId", TEST_IDS.user)
    .replace(":tokenId", ids.tokenId ?? "d61d3f69-00e0-4c4b-bbce-3ae7dc484305")
    .replace(
      ":id",
      entry.module === "categories"
        ? CATEGORY
        : entry.module === "allergens"
          ? ALLERGEN
          : entry.module === "food-items"
            ? FOOD
            : TEST_IDS.other,
    );
const runRequest = (app, entry, { token, body, path } = {}) => {
  let call = request(app)[entry.method.toLowerCase()](path ?? pathFor(entry));
  if (token) call = call.set(bearer(token));
  if (["POST", "PUT", "PATCH", "DELETE"].includes(entry.method))
    call = call.send(body ?? bodyByOperation[entry.operationId] ?? {});
  return call;
};

describe("identity and master-data mounted HTTP API", () => {
  it.each(assigned.map((entry) => [entry.operationId, entry]))(
    "%s has a real happy-path HTTP response",
    async (_name, entry) => {
      const { app } = fixture();
      let token =
        entry.auth === "public"
          ? undefined
          : entry.auth === "admin"
            ? TEST_TOKENS.admin
            : entry.auth === "firebase"
              ? TEST_TOKENS.newcomer
              : TEST_TOKENS.user;
      let path;
      if (entry.operationId === "removeFcmToken") {
        const added = await request(app)
          .post("/api/v1/auth/fcm-tokens")
          .set(bearer(TEST_TOKENS.user))
          .send({ token: "fake-device-token" });
        expect(added.status).toBe(200);
        path = pathFor(entry, { tokenId: added.body.data.tokenId });
      }
      const response = await runRequest(app, entry, { token, path });
      expect(response.status, JSON.stringify(response.body)).toBeGreaterThanOrEqual(200);
      expect(response.status, JSON.stringify(response.body)).toBeLessThan(300);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.requestId).toBeTypeOf("string");
      if (["getMyProfileSummary", "getMe"].includes(entry.operationId))
        expect(response.body.data.user.userId).toBe(TEST_IDS.user);
      if (entry.operationId === "getPublicUserProfile") {
        expect(response.body.data.userId).toBe(TEST_IDS.user);
        expect(response.body.data).not.toHaveProperty("email");
        expect(response.body.data).not.toHaveProperty("dateOfBirth");
      }
      if (entry.operationId === "syncAuth") expect(response.body.data.role).toBe("user");
    },
  );
  it.each(assigned.map((entry) => [entry.operationId, entry]))(
    "%s rejects unauthorized or invalid HTTP input",
    async (_name, entry) => {
      const { app } = fixture();
      let response;
      if (entry.auth !== "public") response = await runRequest(app, entry);
      else if (
        entry.operationId === "getCategories" ||
        entry.operationId === "getAllergens" ||
        entry.operationId === "searchFoodItems"
      )
        response = await request(app).get(pathFor(entry)).query({ limit: 101 });
      else
        response = await request(app).get(
          pathFor(entry).replace(TEST_IDS.user, MISSING).replace(FOOD, MISSING),
        );
      expect(response.status, JSON.stringify(response.body)).toBeGreaterThanOrEqual(400);
      expect(response.status, JSON.stringify(response.body)).toBeLessThan(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBeTypeOf("string");
    },
  );
  it("blocks suspended/deleted identities and keeps identity resolution read-only", async () => {
    const { app, repositories } = fixture();
    for (const token of [TEST_TOKENS.suspended, TEST_TOKENS.deleted]) {
      expect((await request(app).get("/api/v1/users/me").set(bearer(token))).status).toBe(403);
      expect(
        (await request(app).post("/api/v1/auth/sync").set(bearer(token)).send({})).status,
      ).toBe(403);
    }
    expect(
      (await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.newcomer))).status,
    ).toBe(404);
    expect(await repositories.users.findOne({ firebaseUid: "uid-new" })).toBeNull();
  });
  it("does not reset category omitted PATCH fields and records admin audit atomically", async () => {
    const { app, repositories } = fixture();
    const response = await request(app)
      .patch(`/api/v1/categories/${CATEGORY}`)
      .set(bearer(TEST_TOKENS.admin))
      .send({ description: "Changed only description" });
    expect(response.status).toBe(200);
    expect(response.body.data.sortOrder).toBe(3);
    const audit = await repositories.auditLogs.findOne({ action: "category.update" });
    expect(audit.actorId).toBe(TEST_IDS.admin);
    expect(audit.targetId).toBe(CATEGORY);
    expect(
      (
        await request(app)
          .patch(`/api/v1/categories/${CATEGORY}`)
          .set(bearer(TEST_TOKENS.admin))
          .send({})
      ).status,
    ).toBe(400);
  });
  it("never exposes FCM tokens and cleans invalid device registrations through public service", async () => {
    const { app, container } = fixture();
    const one = await request(app)
      .post("/api/v1/auth/fcm-tokens")
      .set(bearer(TEST_TOKENS.user))
      .send({ token: "device-private-token" });
    const two = await request(app)
      .post("/api/v1/auth/fcm-tokens")
      .set(bearer(TEST_TOKENS.user))
      .send({ token: "device-private-token" });
    expect(one.status).toBe(200);
    expect(two.status).toBe(200);
    expect(one.body.data.tokenId).toBe(two.body.data.tokenId);
    expect(await container.services.users.getFcmTokens(TEST_IDS.user)).toHaveLength(1);
    const summary = await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.user));
    expect(JSON.stringify(summary.body)).not.toContain("device-private-token");
    await container.services.users.removeFcmTokens(TEST_IDS.user, ["device-private-token"]);
    expect(await container.services.users.getFcmTokens(TEST_IDS.user)).toHaveLength(0);
  });
  it("fails invalid onboarding atomically and rejects completion until required fields exist", async () => {
    const { app, repositories } = fixture();
    expect(
      (
        await request(app)
          .post("/api/v1/onboarding/complete")
          .set(bearer(TEST_TOKENS.other))
          .send({})
      ).status,
    ).toBe(400);
    const invalid = await request(app)
      .put("/api/v1/onboarding")
      .set(bearer(TEST_TOKENS.other))
      .send({ dietType: "vegan", allergenIds: [MISSING] });
    expect(invalid.status).toBe(404);
    expect(await repositories.userProfiles.findOne({ userId: TEST_IDS.other })).toBeNull();
    const valid = await request(app)
      .put("/api/v1/onboarding")
      .set(bearer(TEST_TOKENS.other))
      .send({ dietType: "vegan", allergenIds: [], goal: "maintain", activityLevel: "light" });
    expect(valid.status).toBe(200);
    const done = await request(app)
      .post("/api/v1/onboarding/complete")
      .set(bearer(TEST_TOKENS.other))
      .send({});
    expect(done.status).toBe(200);
    expect(done.body.data.completed).toBe(true);
  });
  it("rejects last admin removal and soft-deletes owner with immediate access revocation", async () => {
    const { app, repositories } = fixture();
    const role = await request(app)
      .patch(`/api/v1/admin/users/${TEST_IDS.admin}/role`)
      .set(bearer(TEST_TOKENS.admin))
      .send({ role: "user" });
    expect(role.status).toBe(409);
    expect(role.body.error.code).toBe("LAST_ADMIN");
    const suspend = await request(app)
      .post(`/api/v1/admin/users/${TEST_IDS.admin}/suspend`)
      .set(bearer(TEST_TOKENS.admin))
      .send({});
    expect(suspend.status).toBe(409);
    const deleted = await request(app)
      .delete("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({});
    expect(deleted.status).toBe(200);
    expect((await repositories.users.findById(TEST_IDS.user)).status).toBe("deleted");
    expect((await request(app).get("/api/v1/users/me").set(bearer(TEST_TOKENS.user))).status).toBe(
      403,
    );
  });
});
