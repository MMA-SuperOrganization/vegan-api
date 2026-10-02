import { z } from "zod";
export const pantryItemSchema = z
  .object({
    foodItemId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
      .optional(),
    foodNameSnapshot: z.string().trim().optional(),
    quantity: z.number().positive(),
    unit: z.string().trim(),
    expiresAt: z.string().datetime().optional(),
    note: z.string().optional(),
  })
  .strict();
