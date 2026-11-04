import { describe, expect, it } from "vitest";

import { calculateAtwaterCalories, normalizeCalories } from "../../src/common/utils/nutrition.js";
import { createRecipesValidation } from "../../src/modules/recipes/recipes.validation.js";
import { createMealPlansValidation } from "../../src/modules/meal-plans/meal-plans.validation.js";

const foodItemId = "507f1f77bcf86cd799439011";

describe("recipe variants and auditable nutrition", () => {
  it("uses general Atwater 4-4-9 factors when declared calories are unavailable", () => {
    expect(calculateAtwaterCalories({ proteinG: 10, carbsG: 20, fatG: 5 })).toBe(165);
    expect(normalizeCalories({ proteinG: 10, carbsG: 20, fatG: 5 })).toMatchObject({
      nutrition: { caloriesKcal: 165 },
      calculation: { method: "atwater_general", atwaterCaloriesKcal: 165 },
    });
  });

  it("keeps a declared source value and records the Atwater comparison", () => {
    expect(
      normalizeCalories({ caloriesKcal: 170, proteinG: 10, carbsG: 20, fatG: 5 }),
    ).toMatchObject({
      nutrition: { caloriesKcal: 170 },
      calculation: {
        method: "declared",
        declaredCaloriesKcal: 170,
        atwaterCaloriesKcal: 165,
      },
    });
  });

  it("accepts regional variants with independent ingredient sets", () => {
    const schema = createRecipesValidation().createRecipe.body;
    const result = schema.parse({
      title: "Regional soup",
      variants: [
        {
          name: "Central Vietnam",
          region: "Miền Trung",
          countryCode: "vn",
          ingredients: [{ foodItemId, quantity: 100, unit: "g" }],
        },
      ],
    });
    expect(result.variants[0].countryCode).toBe("VN");
  });

  it("accepts allergen-aware substitution queries for a selected variant", () => {
    const schema = createRecipesValidation().getRecipe;
    const result = {
      params: schema.params.parse({ idOrSlug: foodItemId }),
      query: schema.query.parse({
        variantId: "6ba7b810-9dad-51d1-80b4-00c04fd430c8",
        includeSubstitutions: "true",
        excludeAllergenIds: foodItemId,
      }),
    };
    expect(result.query.excludeAllergenIds).toEqual([foodItemId]);
    expect(result.query.includeSubstitutions).toBe(true);
  });
});

describe("reusable meal-plan templates", () => {
  const schema = createMealPlansValidation().cloneMealPlan.body;

  it("allows saving a template without a target week", () => {
    expect(schema.parse({ action: "save_template", title: "Work week" })).toMatchObject({
      action: "save_template",
    });
  });

  it("requires a target week when applying a template", () => {
    expect(() => schema.parse({ action: "apply_template" })).toThrow();
    expect(schema.parse({ action: "apply_template", weekStartDate: "2026-11-09" })).toMatchObject({
      action: "apply_template",
      weekStartDate: "2026-11-09",
    });
  });
});
