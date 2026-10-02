import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createSavedItemsValidation = () => ({
  getSavedItems: {
    query: paginationSchema.passthrough(),
  },
  saveItem: {
    body: z.object({}).passthrough(),
  },
  unsaveItem: {},
});
