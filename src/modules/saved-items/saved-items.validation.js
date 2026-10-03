import { z } from "zod";
import { pagination, targetParams } from "../../common/validators/domain.schemas.js";
import { empty } from "../recipes/content.validation.js";
const params = targetParams(["recipe", "post", "video"]);
export const createSavedItemsValidation = () => ({
  getSavedItems: {
    query: pagination
      .extend({ targetType: z.enum(["recipe", "post", "video"]).optional() })
      .strict(),
  },
  saveItem: { params, body: empty },
  unsaveItem: { params },
});
