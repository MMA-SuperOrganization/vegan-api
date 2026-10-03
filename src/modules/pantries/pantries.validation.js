import { z } from "zod";
import {
  id,
  uuid,
  text,
  positive,
  dateTime,
  pagination,
  patch,
  units,
} from "../../common/validators/domain.schemas.js";
export const pantryItemInput = z
  .object({
    foodItemId: id,
    quantity: positive(),
    unit: units,
    expiresAt: dateTime.nullable().optional(),
    note: text(1000, 0).optional(),
  })
  .strict();
const itemParams = z.object({ itemId: uuid }).strict();
export const createPantriesValidation = () => ({
  getPantry: {},
  addPantryItem: { body: pantryItemInput },
  addPantryItemsBulk: {
    body: z
      .object({ items: z.array(pantryItemInput).min(1).max(100), idempotencyKey: text(128) })
      .strict(),
  },
  updatePantryItem: { params: itemParams, body: patch(pantryItemInput.omit({ foodItemId: true })) },
  deletePantryItem: { params: itemParams },
  getExpiringPantryItems: {
    query: pagination
      .extend({
        days: z.coerce.number().int().min(0).max(90).default(7),
        includeExpired: z
          .enum(["true", "false"])
          .transform((v) => v === "true")
          .default(false),
      })
      .strict(),
  },
  getPantryRecipeSuggestions: {
    query: pagination.extend({ minMatch: z.coerce.number().min(0).max(1).default(0) }).strict(),
  },
});
