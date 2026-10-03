import { quantityToGrams } from "./units.js";

export const NUTRIENT_KEYS = Object.freeze([
  "caloriesKcal",
  "proteinG",
  "carbsG",
  "fatG",
  "fiberG",
  "sugarG",
  "sodiumMg",
  "calciumMg",
  "ironMg",
  "vitaminB12Mcg",
  "vitaminDMcg",
]);
export const emptyNutrition = () => Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, 0]));
export function normalizeNutrition(input = {}) {
  return Object.fromEntries(
    NUTRIENT_KEYS.map((key) => {
      const value = input?.[key] ?? 0;
      if (!Number.isFinite(value) || value < 0) throw new RangeError(`Invalid nutrient: ${key}`);
      return [key, value];
    }),
  );
}
export function scaleNutrition(nutrition, factor) {
  if (!Number.isFinite(factor) || factor < 0) throw new RangeError("Invalid nutrition multiplier");
  return Object.fromEntries(
    Object.entries(normalizeNutrition(nutrition)).map(([key, value]) => [key, value * factor]),
  );
}
export function sumNutrition(values) {
  const result = emptyNutrition();
  for (const nutrition of values)
    for (const [key, value] of Object.entries(normalizeNutrition(nutrition))) result[key] += value;
  return result;
}
/** Ingredients carry resolved nutritionPer100g/defaultServing, or a resolved foodItem. */
export function calculateRecipeNutrition(ingredients, { servings = 1 } = {}) {
  if (!Number.isFinite(servings) || servings <= 0)
    throw new RangeError("Servings must be positive");
  return scaleNutrition(
    sumNutrition(
      ingredients.map((ingredient) => {
        const food = ingredient.foodItem ?? ingredient;
        const grams = quantityToGrams(ingredient.quantity, ingredient.unit, {
          gramEquivalent: ingredient.gramEquivalent,
          defaultServing: food.defaultServing,
        });
        if (grams === null) throw new RangeError("Ingredient requires explicit gram equivalent");
        if (!food.nutritionPer100g) throw new RangeError("Ingredient nutrition is unavailable");
        return scaleNutrition(food.nutritionPer100g, grams / 100);
      }),
    ),
    1 / servings,
  );
}
