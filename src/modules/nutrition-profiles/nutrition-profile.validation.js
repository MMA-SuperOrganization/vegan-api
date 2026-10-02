import { z } from "zod";

export const upsertNutritionProfileBodySchema = z
  .object({
    heightCm: z.number().min(0).max(300).optional(),
    currentWeightKg: z.number().min(0).max(500).optional(),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
    goal: z.enum(["lose_weight", "maintain", "gain_weight", "improve_nutrition"]).optional(),
    dailyCalorieTarget: z.number().min(0).optional(),
    proteinTargetG: z.number().min(0).optional(),
    carbTargetG: z.number().min(0).optional(),
    fatTargetG: z.number().min(0).optional(),
    fiberTargetG: z.number().min(0).optional(),
    waterTargetMl: z.number().min(0).optional(),
    allergenIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"))
      .max(20)
      .optional(),
    medicalNotes: z.string().trim().max(2000).optional(),
  })
  .strict();
