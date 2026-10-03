import { z } from "zod";
import {
  id,
  uuid,
  text,
  positive,
  dateOnly,
  pagination,
  patch,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
export const mealInput = z
  .object({
    type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    recipeId: id,
    servings: positive(100).default(1),
    note: text(1000, 0).optional(),
  })
  .strict();
export const mealPlanInput = z
  .object({
    title: text(200).default("Weekly meal plan"),
    weekStartDate: dateOnly,
    days: z
      .array(z.object({ date: dateOnly, meals: z.array(mealInput).max(12) }).strict())
      .max(7)
      .default([]),
  })
  .strict()
  .refine(
    (body) =>
      new Set(body.days.map((day) => day.date)).size === body.days.length &&
      body.days.every(
        (day) =>
          day.date >= body.weekStartDate &&
          new Date(day.date) - new Date(body.weekStartDate) < 7 * 86400000,
      ),
    "Plan dates must be unique and within its week",
  );
const params = z.object({ id }).strict();
const mealParams = params.extend({ mealId: uuid });
export const createMealPlansValidation = () => ({
  getMealPlans: {
    query: pagination
      .extend({
        weekStartDate: dateOnly.optional(),
        status: z.enum(["draft", "active", "archived"]).optional(),
      })
      .strict(),
  },
  getCurrentMealPlan: { query: z.object({ date: dateOnly.optional() }).strict() },
  getMealPlan: { params },
  createMealPlan: { body: mealPlanInput },
  updateMealPlan: {
    params,
    body: patch(z.object({ title: text(200), status: z.enum(["draft", "archived"]) })),
  },
  deleteMealPlan: { params },
  addMealToPlan: { params, body: mealInput.extend({ date: dateOnly }).strict() },
  updateMealInPlan: {
    params: mealParams,
    body: patch(mealInput.extend({ servings: positive(100), completed: z.boolean() })),
  },
  deleteMealFromPlan: { params: mealParams },
  activateMealPlan: { params, body: emptyBody },
  cloneMealPlan: {
    params,
    body: z.object({ weekStartDate: dateOnly, title: text(200).optional() }).strict(),
  },
  generateGroceryListFromPlan: {
    params,
    body: z
      .object({ name: text(200).optional(), subtractPantry: z.boolean().default(false) })
      .strict(),
  },
});
