import { z } from "zod";
import { id, text, positive, units, dietTypes } from "../../common/validators/domain.schemas.js";
import {
  idParams,
  slugParams,
  versionBody,
  rejectBody,
  ids,
  tags,
  contentQuery,
  mineQuery,
  contentPatch,
  excludedAllergens,
} from "../../common/validators/content.schemas.js";
export const ingredientInput = z
  .object({
    foodItemId: id,
    quantity: positive(100000),
    unit: units,
    gramEquivalent: positive(1000000).optional(),
    note: text(500, 0).optional(),
    optional: z.boolean().optional(),
    order: z.number().int().min(1).max(200).optional(),
  })
  .strict();
export const stepInput = z
  .object({
    order: z.number().int().min(1).max(200),
    instruction: text(5000),
    mediaId: id.optional().nullable(),
    timerSeconds: z.number().int().min(0).max(86400).optional(),
  })
  .strict();
export const recipeInput = z
  .object({
    title: text(200),
    summary: text(1000, 0).optional(),
    description: text(10000, 0).optional(),
    coverMediaId: id.optional().nullable(),
    mediaIds: ids.optional(),
    categoryIds: ids.optional(),
    tags: tags.optional(),
    cuisine: text(100).optional(),
    servings: z.number().int().min(1).max(1000).optional(),
    prepMinutes: z.number().int().min(0).max(10080).optional(),
    cookMinutes: z.number().int().min(0).max(10080).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    ingredients: z.array(ingredientInput).max(200).optional(),
    steps: z
      .array(stepInput)
      .max(200)
      .refine(
        (steps) => new Set(steps.map((s) => s.order)).size === steps.length,
        "Step order must be unique",
      )
      .optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
  })
  .strict();
export const createRecipesValidation = () => ({
  getRecipes: {
    query: contentQuery.extend({
      cuisine: text(100).optional(),
      maxTotalMinutes: z.coerce.number().int().min(1).max(20160).optional(),
      excludeAllergenIds: excludedAllergens.optional(),
      dietType: dietTypes.optional(),
    }),
  },
  getMyRecipes: { query: mineQuery },
  getRecipe: { params: slugParams },
  createRecipe: { body: recipeInput },
  updateRecipe: { params: idParams, body: contentPatch(recipeInput) },
  deleteRecipe: { params: idParams },
  submitRecipe: { params: idParams, body: versionBody },
  publishRecipe: { params: idParams, body: versionBody },
  rejectRecipe: { params: idParams, body: rejectBody },
  getRecipeNutrition: { params: idParams },
});
