import { z } from "zod";
import {
  id,
  text,
  positive,
  units,
  nutrients,
  url,
  pagination,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
import { MASTER_DATA_STATUSES } from "../../common/constants/enums/master-data.enums.js";
const shape = {
  name: text(150),
  slug: text(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  aliases: z
    .array(text(150))
    .max(30)
    .transform((v) => [...new Set(v)])
    .optional(),
  categoryId: id,
  imageUrl: url.max(2048).nullable().optional(),
  description: text(2000, 0).optional(),
  seasons: z
    .array(z.number().int().min(1).max(12))
    .max(12)
    .transform((months) => [...new Set(months)])
    .optional(),
  defaultServing: z
    .object({ amount: positive(100000), unit: units, gramEquivalent: positive(100000) })
    .strict(),
  nutritionPer100g: nutrients,
  allergenIds: z
    .array(id)
    .max(50)
    .transform((v) => [...new Set(v)])
    .optional(),
  isVegan: z.boolean(),
  isVegetarian: z.boolean(),
  containsEggs: z.boolean().optional(),
  containsDairy: z.boolean().optional(),
  status: z.enum(MASTER_DATA_STATUSES.values()).optional(),
};
const consistent = (v) =>
  !v.isVegan || (v.isVegetarian !== false && !v.containsEggs && !v.containsDairy);
export const foodItemSchema = z
  .object(shape)
  .strict()
  .refine(consistent, "Vegan foods must be vegetarian and cannot contain eggs or dairy");
export const foodItemPatchSchema = z
  .object(shape)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required")
  .refine(consistent, "Vegan foods must be vegetarian and cannot contain eggs or dairy");
const booleanQuery = z.enum(["true", "false"]).transform((v) => v === "true");
const idsQuery = z
  .union([
    z
      .string()
      .max(1300)
      .transform((v) => (v ? v.split(",") : [])),
    z.array(id).max(50),
  ])
  .pipe(z.array(id).max(50))
  .transform((v) => [...new Set(v)]);
export const createFoodItemsValidation = () => ({
  searchFoodItems: {
    query: pagination
      .extend({
        q: text(100).optional(),
        category: id.optional(),
        categoryId: id.optional(),
        excludeAllergenIds: idsQuery.optional(),
        allergenExclusion: idsQuery.optional(),
        isVegan: booleanQuery.optional(),
        status: z.enum(MASTER_DATA_STATUSES.values()).optional(),
        isVegetarian: booleanQuery.optional(),
        sort: z
          .enum(["name", "-name", "createdAt", "-createdAt", "calories", "-calories"])
          .default("name"),
      })
      .strict(),
  },
  getFoodItem: { params: z.object({ id }).strict() },
  createFoodItem: { body: foodItemSchema },
  updateFoodItem: { params: z.object({ id }).strict(), body: foodItemPatchSchema },
  deleteFoodItem: { params: z.object({ id }).strict(), body: emptyBody },
});
