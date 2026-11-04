import { z } from "zod";
import {
  id,
  uuid,
  text,
  dateOnly,
  pagination,
  patch,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
import { MEAL_TYPES, MEAL_PLAN_STATUSES } from "../../common/constants/enums/planning.enums.js";

const mealServings = z.number().finite().int().min(1).max(100);

export const mealInput = z
  .object({
    type: z.enum(MEAL_TYPES.values()),
    recipeId: id,
    servings: mealServings.default(1),
    note: text(1000, 0).optional(),
    acknowledgeAllergens: z.boolean().optional(),
    consumePantry: z.boolean().optional(),
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
export const groceryGenerationInput = z
  .object({
    name: text(200).optional(),
    subtractPantry: z.boolean().default(false),
    scope: z.enum(["day", "week"]).optional(),
    date: dateOnly.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .strict()
  .refine((body) => !body.from || !body.to || body.from <= body.to, {
    message: "Start date must not be after end date",
    path: ["to"],
  })
  .superRefine((body, context) => {
    if (body.scope === "day" && !body.date) {
      context.addIssue({
        code: "custom",
        message: "A date is required when grocery scope is day",
        path: ["date"],
      });
    }
    if (body.scope && (body.from || body.to)) {
      context.addIssue({
        code: "custom",
        message: "Use scope instead of a custom date range",
        path: ["scope"],
      });
    }
    if (body.scope === "week" && body.date) {
      context.addIssue({
        code: "custom",
        message: "Week scope does not accept a single date",
        path: ["date"],
      });
    }
  });
const params = z.object({ id }).strict();
const mealParams = params.extend({ mealId: uuid });
export const createMealPlansValidation = () => ({
  getMealPlans: {
    query: pagination
      .extend({
        weekStartDate: dateOnly.optional(),
        status: z.enum(MEAL_PLAN_STATUSES.values()).optional(),
        isTemplate: z.coerce.boolean().optional(),
      })
      .strict(),
  },
  getCurrentMealPlan: { query: z.object({ date: dateOnly.optional() }).strict() },
  getMealPlan: { params },
  createMealPlan: { body: mealPlanInput },
  updateMealPlan: {
    params,
    body: patch(
      z.object({
        title: text(200),
        status: z.enum([
          MEAL_PLAN_STATUSES.DRAFT,
          MEAL_PLAN_STATUSES.COMPLETED,
          MEAL_PLAN_STATUSES.ARCHIVED,
        ]),
      }),
    ),
  },
  deleteMealPlan: { params },
  addMealToPlan: { params, body: mealInput.extend({ date: dateOnly }).strict() },
  updateMealInPlan: {
    params: mealParams,
    body: patch(mealInput.extend({ servings: mealServings, completed: z.boolean() })),
  },
  deleteMealFromPlan: { params: mealParams },
  activateMealPlan: { params, body: emptyBody },
  cloneMealPlan: {
    params,
    body: z
      .object({
        weekStartDate: dateOnly.optional(),
        title: text(200).optional(),
        action: z.enum(["clone", "save_template", "apply_template"]).default("clone"),
      })
      .strict()
      .refine((body) => body.action === "save_template" || body.weekStartDate, {
        message: "A target week is required",
        path: ["weekStartDate"],
      }),
  },
  generateGroceryListFromPlan: {
    params,
    body: groceryGenerationInput,
  },
});
