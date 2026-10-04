import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i);
const text = (max) => z.string().trim().min(1).max(max);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const pagination = z.strictObject({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const mealPlanOutput = z.strictObject({
  title: text(160),
  days: z
    .array(
      z.strictObject({
        date,
        meals: z
          .array(
            z.strictObject({
              slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
              recipeId: id,
              servings: z.number().positive().max(20),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(7),
  notes: z.string().max(2000).optional(),
});
export const pantryOutput = z.strictObject({
  items: z
    .array(
      z.strictObject({
        foodItemId: id.optional(),
        name: text(160),
        quantity: z.number().positive().max(100000),
        unit: z.enum(["g", "kg", "ml", "l", "piece", "cup", "tbsp", "tsp", "serving"]),
        expiryDate: date.optional(),
      }),
    )
    .min(1)
    .max(50),
  notes: z.string().max(2000).optional(),
});
export const chatOutput = z.strictObject({ content: text(8000) });
export const summaryOutput = z.strictObject({
  summary: text(8000),
  keyPoints: z.array(text(500)).max(20),
  chapters: z
    .array(
      z
        .strictObject({
          title: text(200),
          startSeconds: z.number().finite().min(0).max(86400),
          endSeconds: z.number().finite().min(0).max(86400),
        })
        .refine(
          (chapter) => chapter.endSeconds > chapter.startSeconds,
          "Chapter end must follow start",
        ),
    )
    .max(100)
    .optional(),
});
export const createAiValidation = () => ({
  getAiConversations: { query: pagination },
  createAiConversation: { body: z.strictObject({ title: text(160).default("New conversation") }) },
  getAiMessages: { params: z.strictObject({ id }), query: pagination },
  sendAiMessage: { params: z.strictObject({ id }), body: z.strictObject({ content: text(4000) }) },
  createMealPlanProposal: {
    body: z.strictObject({
      title: text(160).optional(),
      startDate: date,
      days: z.number().int().min(1).max(7).default(7),
      preferences: z.string().max(2000).optional(),
    }),
  },
  confirmMealPlanProposal: {
    params: z.strictObject({ proposalId: id }),
    body: z.strictObject({
      activate: z.boolean().default(false),
      title: mealPlanOutput.shape.title.optional(),
      days: mealPlanOutput.shape.days.optional(),
    }),
  },
  recognizeIngredients: { body: z.strictObject({ mediaId: id }) },
  confirmPantryProposal: {
    params: z.strictObject({ proposalId: id }),
    body: z.strictObject({
      items: z
        .array(pantryOutput.shape.items.element.omit({ name: true }).extend({ foodItemId: id }))
        .min(1)
        .max(50)
        .optional(),
    }),
  },
  generateVideoSummary: {
    body: z.strictObject({ mediaId: id, transcript: text(20000).optional() }),
  },
  submitAiFeedback: {
    params: z.strictObject({ runId: id }),
    body: z.strictObject({
      rating: z.enum(["helpful", "not_helpful"]),
      reason: z.string().trim().max(300).optional(),
      comment: z.string().trim().max(2000).optional(),
    }),
  },
});
