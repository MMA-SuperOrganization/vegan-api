import { z } from "zod";
import { pagination, targetParams } from "../../common/validators/domain.schemas.js";
import { empty } from "../../common/validators/content.schemas.js";
const params = targetParams(["recipe", "post", "video"]);
export const createViewHistoryValidation = () => ({
  getViewHistory: {
    query: pagination
      .extend({ targetType: z.enum(["recipe", "post", "video"]).optional() })
      .strict(),
  },
  clearViewHistory: {},
  deleteViewHistoryItem: { params },
  recordView: { params, body: empty },
});
