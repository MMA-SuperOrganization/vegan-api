import { describe, expect, it } from "vitest";
import {
  inferAllergens,
  transformForkRecipe,
  transformUsdaFoundation,
} from "../../scripts/build-open-catalog.js";
import { createFoodMatcher } from "../../scripts/import-open-catalog.js";

describe("open catalog ingestion", () => {
  it("maps public-domain USDA plant foods and nutrient identifiers", () => {
    const foods = transformUsdaFoundation(
      {
        FoundationFoods: [
          {
            fdcId: 123,
            description: "Tofu, raw",
            foodCategory: { description: "Legumes and Legume Products" },
            foodNutrients: [
              { nutrient: { id: 1008 }, amount: 76 },
              { nutrient: { id: 1003 }, amount: 8.1 },
            ],
          },
          {
            fdcId: 456,
            description: "Chicken, raw",
            foodCategory: { description: "Poultry Products" },
            foodNutrients: [],
          },
        ],
      },
      "2026-10-27T00:00:00.000Z",
    );

    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({
      sourceSlug: "usda-fdc-123",
      category: "Legumes",
      nutritionPer100g: { caloriesKcal: 76, proteinG: 8.1 },
      nutritionDataQuality: "verified",
      sourceAttribution: { license: "CC0-1.0", sourceId: "123" },
    });
    expect(inferAllergens("Firm tofu with sesame")).toEqual(["Soy", "Sesame"]);
  });

  it("accepts explicitly vegan recipes and rejects animal-derived ingredient lists", () => {
    const base = {
      repoId: "recipe-1",
      slug: "tofu-bowl",
      title: "Tofu Bowl",
      description: "A weeknight bowl.",
      tags: ["vegan", "dinner"],
      difficulty: 1,
      activeTime: "10 min",
      totalTime: "20 min",
      ingredients: [{ name: "Firm tofu", role: "Protein", ratioValue: 200, defaultUnit: "g" }],
      processNodes: [{ instructions: "Cook the tofu." }],
    };
    expect(transformForkRecipe(base)).toMatchObject({
      title: "Tofu Bowl",
      category: "Dinner",
      sourceAttribution: { license: "CC-BY-SA-4.0" },
    });
    expect(
      transformForkRecipe({
        ...base,
        ingredients: [{ name: "Chicken stock", role: "Liquid", ratioValue: 1, defaultUnit: "cup" }],
      }),
    ).toBeNull();
    expect(
      transformForkRecipe({
        ...base,
        slug: "coconut-curry",
        ingredients: [
          { name: "Coconut milk", role: "Liquid", ratioValue: 1, defaultUnit: "cup" },
          { name: "Eggplant", role: "Vegetable", ratioValue: 200, defaultUnit: "g" },
        ],
      }),
    ).not.toBeNull();
  });

  it("matches prepared ingredient labels to verified USDA-style food names", () => {
    const verified = {
      _id: "verified-cilantro",
      name: "Coriander (cilantro) leaves, raw",
      aliases: [],
      nutritionDataQuality: "verified",
    };
    const placeholder = {
      _id: "placeholder-cilantro",
      name: "Cilantro (leaves and tender stems)",
      aliases: [],
      nutritionDataQuality: "unavailable",
    };

    const matchFood = createFoodMatcher([placeholder, verified]);

    expect(matchFood("Cilantro (leaves and tender stems)")).toBe(verified);
  });
});
