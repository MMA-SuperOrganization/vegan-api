import { z } from "zod";
import {
  id,
  text,
  positive,
  dateOnly,
  dateTime,
  units,
  nutrients,
  rangeQuery,
  patch,
  timezone,
} from "../../common/validators/domain.schemas.js";
import {
  MEAL_TYPES,
  DIARY_SOURCE_TYPES,
} from "../../common/constants/enums/planning.enums.js";

const common = {
  date: dateOnly,
  mealType: z.enum(MEAL_TYPES.values()),
  note: text(1000, 0).optional(),
  consumedAt: dateTime.optional(),
};
export const diaryInput = z.discriminatedUnion("sourceType", [
  z
    .object({ ...common, sourceType: z.literal(DIARY_SOURCE_TYPES.RECIPE), recipeId: id, servings: positive(100) })
    .strict(),
  z
    .object({
      ...common,
      sourceType: z.literal(DIARY_SOURCE_TYPES.FOOD),
      foodItemId: id,
      quantity: positive(),
      unit: units,
    })
    .strict(),
  z
    .object({
      ...common,
      sourceType: z.literal(DIARY_SOURCE_TYPES.CUSTOM),
      nameSnapshot: text(200),
      servings: positive(100).default(1),
      nutritionSnapshot: nutrients,
    })
    .strict(),
]);
const query = rangeQuery
  .extend({ date: dateOnly.optional(), timezone: timezone.default("UTC") })
  .strict()
  .refine((v) => !v.date || (!v.from && !v.to), "Use date or range, not both");
const params = z.object({ id }).strict();
export const createDiaryValidation = () => ({
  getDiaryEntries: { query },
  createDiaryEntry: { body: diaryInput },
  updateDiaryEntry: {
    params,
    body: patch(
      z.object({
        servings: positive(100),
        quantity: positive(),
        unit: units,
        note: text(1000, 0),
        consumedAt: dateTime,
      }),
    ),
  },
  deleteDiaryEntry: { params },
  getDiarySummary: { query },
});
