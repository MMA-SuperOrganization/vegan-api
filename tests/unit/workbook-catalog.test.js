import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

const catalog = JSON.parse(
  await fs.readFile(
    new URL("../../scripts/catalog-data/vegeta-workbook-catalog.json", import.meta.url),
  ),
);

describe("VEGETA workbook catalog", () => {
  it("contains every workbook dataset plus regional variants", () => {
    expect(catalog.stats).toMatchObject({
      categories: 12,
      allergens: 5,
      foods: 40,
      recipes: 20,
      variants: 60,
      posts: 100,
    });
    expect(catalog.recipes).toHaveLength(20);
    expect(catalog.recipes.every((recipe) => recipe.variants.length === 3)).toBe(true);
    expect(
      catalog.recipes.every((recipe) =>
        recipe.variants.every(
          (variant) =>
            variant.ingredients.length > 0 &&
            variant.ingredients.some((item, index) =>
              recipe.ingredients[index]
                ? item.foodItemId !== recipe.ingredients[index].foodItemId
                : true,
            ),
        ),
      ),
    ).toBe(true);
  });

  it("upgrades matched ingredient nutrition to attributed USDA records", () => {
    const verified = catalog.foods.filter((food) => food.nutritionDataQuality === "verified");
    expect(verified.length).toBeGreaterThanOrEqual(20);
    expect(
      verified.every((food) => food.sourceAttribution.provider === "USDA FoodData Central"),
    ).toBe(true);
    expect(
      verified.every(
        (food) =>
          food.sourceAttribution.sourceId &&
          food.sourceAttribution.url &&
          food.sourceAttribution.license === "CC0-1.0",
      ),
    ).toBe(true);
  });

  it("keeps every relationship resolvable", () => {
    const foodIds = new Set(catalog.foods.map((food) => food.workbookId));
    const recipeIds = new Set(catalog.recipes.map((recipe) => recipe.workbookId));
    expect(
      catalog.recipes.every((recipe) =>
        [...recipe.ingredients, ...recipe.variants.flatMap((variant) => variant.ingredients)].every(
          (ingredient) => foodIds.has(ingredient.foodItemId),
        ),
      ),
    ).toBe(true);
    expect(
      catalog.posts.every(
        (post) =>
          (!post.recipeId || recipeIds.has(post.recipeId)) &&
          String(post.foodItemIds ?? "")
            .split(";")
            .map((id) => id.trim())
            .filter(Boolean)
            .every((id) => foodIds.has(id)),
      ),
    ).toBe(true);
  });
});
