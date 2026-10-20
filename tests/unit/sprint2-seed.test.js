import { describe, expect, it } from "vitest";
import { verifySprint2Seed } from "../../scripts/verify-sprint2-seed.js";

const database = (seed) => ({
  collection: (name) => ({ find: () => ({ toArray: async () => seed[name] ?? [] }) }),
});
const catalog = {
  fooditems: [{ _id: "f", categoryId: "c", allergenIds: ["a"], nutritionPer100g: {} }],
  categories: [{ _id: "c" }],
  allergens: [{ _id: "a" }],
  recipes: [
    {
      _id: "r",
      status: "published",
      servings: 2,
      ingredients: [{ foodItemId: "f" }],
      nutritionPerServing: { caloriesKcal: 100, proteinG: 5, carbsG: 10, fatG: 4 },
    },
  ],
};
describe("read-only Sprint 2 seed verification", () => {
  it("accepts a complete linked catalog using the canonical fooditems collection", async () => {
    expect(await verifySprint2Seed(database(catalog))).toMatchObject({
      passed: true,
      publishedRecipes: 1,
      counts: { foodItems: 1 },
      problems: [],
    });
  });
  it("reports empty catalogs and broken ingredient/category/allergen references", async () => {
    const broken = await verifySprint2Seed(
      database({
        ...catalog,
        fooditems: [{ _id: "wrong", categoryId: "missing", allergenIds: ["missing"] }],
        allergens: [],
      }),
    );
    expect(broken.passed).toBe(false);
    expect(broken.problems).toEqual(
      expect.arrayContaining([
        "allergens: empty collection",
        "food wrong: missing category",
        "food wrong: missing allergen missing",
        "recipe r: missing food f",
      ]),
    );
  });
});
