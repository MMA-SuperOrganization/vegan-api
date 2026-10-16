import { z } from "zod";
import { pagination, targetParams } from "../../common/validators/domain.schemas.js";
import { empty } from "../../common/validators/content.schemas.js";
import { VIEW_HISTORY_TARGET_TYPES } from "../../common/constants/enums/engagement.enums.js";

const params = targetParams(VIEW_HISTORY_TARGET_TYPES.values());
export const createViewHistoryValidation = () => ({
  getViewHistory: {
    query: pagination
      .extend({ targetType: z.enum(VIEW_HISTORY_TARGET_TYPES.values()).optional() })
      .strict(),
  },
  clearViewHistory: {},
  deleteViewHistoryItem: { params },
  recordView: { params, body: empty },
});
