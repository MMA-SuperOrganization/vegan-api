import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createPantriesValidation = () => ({
  getPantry: {
    query: paginationSchema.passthrough(),
  },
  addPantryItem: {
    body: z.object({}).passthrough(),
  },
  addPantryItemsBulk: {
    body: z.object({}).passthrough(),
  },
  updatePantryItem: {
    body: z.object({}).passthrough(),
  },
  deletePantryItem: {},
  getExpiringPantryItems: {
    query: paginationSchema.passthrough(),
  },
  getPantryRecipeSuggestions: {
    query: paginationSchema.passthrough(),
  },
});
