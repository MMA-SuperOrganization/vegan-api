import { z } from "zod";
import { pagination, targetParams } from "../../common/validators/domain.schemas.js";
import { empty } from "../../common/validators/content.schemas.js";
import { SAVED_TARGET_TYPES } from "./saved-items.constants.js";

const params = targetParams(SAVED_TARGET_TYPES);
export const createSavedItemsValidation = () => ({
  getSavedItems: {
    query: pagination.extend({ targetType: z.enum(SAVED_TARGET_TYPES).optional() }).strict(),
  },
  saveItem: { params, body: empty },
  unsaveItem: { params },
});
