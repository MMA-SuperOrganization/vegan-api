import { z } from "zod";
import {
  id,
  uuid,
  text,
  positive,
  units,
  pagination,
  patch,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
export const groceryItemInput = z
  .object({
    foodItemId: id.optional(),
    nameSnapshot: text(200).optional(),
    quantity: positive(),
    unit: units,
    note: text(1000, 0).optional(),
  })
  .strict()
  .refine((body) => body.foodItemId || body.nameSnapshot, "Food item or item name is required");
export const groceryListInput = z
  .object({ name: text(200), items: z.array(groceryItemInput).max(500).default([]) })
  .strict();
const params = z.object({ id }).strict();
export const createGroceryListsValidation = () => ({
  getGroceryLists: {
    query: pagination
      .extend({ status: z.enum(["active", "completed", "archived"]).optional() })
      .strict(),
  },
  getGroceryList: { params },
  createGroceryList: { body: groceryListInput },
  updateGroceryList: {
    params,
    body: patch(z.object({ name: text(200), status: z.enum(["active", "completed", "archived"]) })),
  },
  deleteGroceryList: { params },
  addGroceryItem: { params, body: groceryItemInput },
  updateGroceryItem: {
    params: params.extend({ itemId: uuid }),
    body: patch(
      z.object({
        nameSnapshot: text(200),
        quantity: positive(),
        unit: units,
        note: text(1000, 0),
        checked: z.boolean(),
      }),
    ),
  },
  deleteGroceryItem: { params: params.extend({ itemId: uuid }) },
  clearCheckedGroceryItems: { params, body: emptyBody },
});
