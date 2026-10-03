import { z } from "zod";
import { id, positive, text, emptyBody } from "../../common/validators/domain.schemas.js";
export const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
export const goalSchema = z.enum(["lose_weight", "maintain", "gain_weight", "improve_nutrition"]);
export const nutritionProfileSchema = z
  .object({
    heightCm: positive(250).min(50).optional(),
    currentWeightKg: positive(500).min(10).optional(),
    activityLevel: activityLevelSchema.optional(),
    goal: goalSchema.optional(),
    dailyCalorieTarget: positive(10000).min(500).optional(),
    proteinTargetG: positive(500).optional(),
    carbTargetG: positive(1500).optional(),
    fatTargetG: positive(500).optional(),
    fiberTargetG: positive(100).optional(),
    waterTargetMl: positive(10000).min(250).optional(),
    allergenIds: z
      .array(id)
      .max(50)
      .transform((v) => [...new Set(v)])
      .optional(),
    medicalNotes: text(2000, 0).nullable().optional(),
  })
  .strict();
export const createNutritionProfilesValidation = () => ({
  getMyNutritionProfile: {},
  upsertMyNutritionProfile: {
    body: nutritionProfileSchema.refine(
      (value) => Object.keys(value).length > 0,
      "At least one field is required",
    ),
  },
  recalculateNutritionTarget: { body: emptyBody },
});
