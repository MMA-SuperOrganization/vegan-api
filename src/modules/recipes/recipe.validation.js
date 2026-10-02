import { z } from "zod";

export const createRecipeBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1),
    description: z.string().trim().max(1000).optional(),
    content: z.string().trim().optional(),
    thumbnailUrl: z.string().trim().url().max(1024).optional(),
    videoUrl: z.string().trim().url().max(1024).optional(),
    prepTimeMinutes: z.number().min(0).optional(),
    cookTimeMinutes: z.number().min(0).optional(),
    servings: z.number().min(1).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    ingredients: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          amount: z.number().min(0),
          unit: z.string().trim().min(1),
          foodItemId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
            .optional(),
          note: z.string().trim().optional(),
        }),
      )
      .optional(),
    instructions: z
      .array(
        z.object({
          stepNumber: z.number().min(1),
          text: z.string().trim().min(1),
          imageUrl: z.string().trim().url().optional(),
        }),
      )
      .optional(),
    nutritionPerServing: z
      .object({
        caloriesKcal: z.number().min(0).optional(),
        proteinG: z.number().min(0).optional(),
        carbsG: z.number().min(0).optional(),
        fatG: z.number().min(0).optional(),
        fiberG: z.number().min(0).optional(),
      })
      .optional(),
    categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).optional(),
    dietaryTags: z.array(z.string().trim()).optional(),
    allergenIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).optional(),
    status: z.enum(["draft", "pending", "published"]).optional(),
  })
  .strict();

export const updateRecipeBodySchema = createRecipeBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for update");
