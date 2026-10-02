import { z } from "zod";

export const createFoodItemBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1),
    aliases: z.array(z.string().trim()).max(20).optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
      .optional(),
    imageUrl: z.string().trim().url().max(1024).optional(),
    defaultServing: {
      amount: z.number().positive(),
      unit: z.string().min(1),
      gramEquivalent: z.number().positive(),
    },
    nutritionPer100g: z
      .object({
        caloriesKcal: z.number().min(0).optional(),
        proteinG: z.number().min(0).optional(),
        carbsG: z.number().min(0).optional(),
        fatG: z.number().min(0).optional(),
        fiberG: z.number().min(0).optional(),
        sugarG: z.number().min(0).optional(),
        sodiumMg: z.number().min(0).optional(),
        calciumMg: z.number().min(0).optional(),
        ironMg: z.number().min(0).optional(),
        vitaminB12Mcg: z.number().min(0).optional(),
        vitaminDMcg: z.number().min(0).optional(),
      })
      .optional(),
    allergenIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"))
      .max(20)
      .optional(),
    isVegan: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

export const updateFoodItemBodySchema = createFoodItemBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
