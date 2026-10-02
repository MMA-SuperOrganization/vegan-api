import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createGroceryListsValidation = () => ({
  getGroceryLists: {
    query: paginationSchema.passthrough(),
  },
  getGroceryList: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  createGroceryList: {
    body: z.object({}).passthrough(),
  },
  updateGroceryList: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteGroceryList: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  addGroceryItem: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  updateGroceryItem: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteGroceryItem: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  clearCheckedGroceryItems: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
});
