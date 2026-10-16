import { z } from "zod";
import { targetParams } from "../../common/validators/domain.schemas.js";
import {
  REACTION_TARGET_TYPES,
  REACTION_TYPES,
} from "../../common/constants/enums/engagement.enums.js";

export const createReactionsValidation = () => ({
  upsertReaction: {
    params: targetParams(REACTION_TARGET_TYPES.values()),
    body: z.object({ type: z.enum(REACTION_TYPES.values()) }).strict(),
  },
  deleteReaction: { params: targetParams(REACTION_TARGET_TYPES.values()) },
});
