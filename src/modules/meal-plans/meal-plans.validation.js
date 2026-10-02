import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createMealPlansValidation = () => ({
  getMealPlans: {
    query: paginationSchema.passthrough(),
  },
  getCurrentMealPlan: {
    query: paginationSchema.passthrough(),
  },
  getMealPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  createMealPlan: {
    body: z.object({}).passthrough(),
  },
  updateMealPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteMealPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  addMealToPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  updateMealInPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteMealFromPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  activateMealPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  cloneMealPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  generateGroceryListFromPlan: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
});
