import request from "supertest";
import { describe, expect, it } from "vitest";
import { bearer, buildTestApp, TEST_IDS, TEST_TOKENS } from "../helpers/test-app.js";

const FOOD_ID = "200000000000000000000010";

const fixture = () =>
  buildTestApp({
    seed: {
      foodItems: [
        {
          _id: FOOD_ID,
          name: "Tofu",
          normalizedName: "tofu",
          slug: "tofu",
          status: "active",
          defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
          nutritionPer100g: { caloriesKcal: 100 },
        },
      ],
    },
  });

describe("personal ingredient HTTP flow", () => {
  it("merges catalog and owner suggestions and links personal ingredients to grocery items", async () => {
    const { app } = fixture();
    const created = await request(app)
      .post("/api/v1/personal-ingredients")
      .set(bearer(TEST_TOKENS.user))
      .send({ name: "Tofu skin", defaultUnit: "g" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: "Tofu skin",
      defaultUnit: "g",
      status: "active",
    });
    expect(created.body.data).not.toHaveProperty("userId");
    expect(created.body.data).not.toHaveProperty("normalizedName");

    const suggestions = await request(app)
      .get("/api/v1/ingredients/suggestions")
      .set(bearer(TEST_TOKENS.user))
      .query({ q: "tofu" });
    expect(suggestions.status).toBe(200);
    expect(suggestions.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "catalog", foodItemId: FOOD_ID, name: "Tofu" }),
        expect.objectContaining({
          source: "personal",
          personalIngredientId: created.body.data._id,
          name: "Tofu skin",
        }),
      ]),
    );

    const grocery = await request(app)
      .post("/api/v1/grocery-lists")
      .set(bearer(TEST_TOKENS.user))
      .send({
        name: "My groceries",
        items: [
          {
            personalIngredientId: created.body.data._id,
            quantity: 250,
            unit: "g",
          },
        ],
      });
    expect(grocery.status).toBe(201);
    expect(grocery.body.data.items[0]).toMatchObject({
      personalIngredientId: created.body.data._id,
      nameSnapshot: "Tofu skin",
      quantity: 250,
      unit: "g",
    });

    const otherOwner = await request(app)
      .post("/api/v1/grocery-lists")
      .set(bearer(TEST_TOKENS.other))
      .send({
        name: "Not mine",
        items: [
          {
            personalIngredientId: created.body.data._id,
            quantity: 1,
            unit: "piece",
          },
        ],
      });
    expect(otherOwner.status).toBe(404);
  });

  it("keeps names unique per owner and hides inactive ingredients from suggestions", async () => {
    const { app } = fixture();
    const first = await request(app)
      .post("/api/v1/personal-ingredients")
      .set(bearer(TEST_TOKENS.user))
      .send({ name: "Đậu hũ ky", defaultUnit: "g" });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post("/api/v1/personal-ingredients")
      .set(bearer(TEST_TOKENS.user))
      .send({ name: "Dau hu ky", defaultUnit: "piece" });
    expect(duplicate.status).toBe(409);

    const otherOwner = await request(app)
      .post("/api/v1/personal-ingredients")
      .set(bearer(TEST_TOKENS.other))
      .send({ name: "Đậu hũ ky", defaultUnit: "piece" });
    expect(otherOwner.status).toBe(201);

    const removed = await request(app)
      .delete(`/api/v1/personal-ingredients/${first.body.data._id}`)
      .set(bearer(TEST_TOKENS.user));
    expect(removed.status).toBe(200);
    expect(removed.body.data.status).toBe("inactive");

    const suggestions = await request(app)
      .get("/api/v1/ingredients/suggestions")
      .set(bearer(TEST_TOKENS.user))
      .query({ q: "dau hu ky" });
    expect(suggestions.status).toBe(200);
    expect(suggestions.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ personalIngredientId: first.body.data._id }),
      ]),
    );

    const stolenUpdate = await request(app)
      .patch(`/api/v1/personal-ingredients/${otherOwner.body.data._id}`)
      .set(bearer(TEST_TOKENS.user))
      .send({ name: "Stolen" });
    expect(stolenUpdate.status).toBe(404);
    expect(TEST_IDS.user).not.toBe(TEST_IDS.other);
  });

  it("requires authentication for personal ingredient operations", async () => {
    const { app } = fixture();
    const suggestions = await request(app)
      .get("/api/v1/ingredients/suggestions")
      .query({ q: "tofu" });
    expect(suggestions.status).toBe(401);
    const create = await request(app)
      .post("/api/v1/personal-ingredients")
      .send({ name: "Private", defaultUnit: "g" });
    expect(create.status).toBe(401);
  });
});
