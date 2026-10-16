import mongoose from "mongoose";
import { registerModel, ref } from "../../common/persistence/content-model.js";
import {
  REACTION_TARGET_TYPES,
  REACTION_TYPES,
} from "../../common/constants/enums/engagement.enums.js";

export const ReactionsModel = registerModel(
  "Reactions",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: REACTION_TARGET_TYPES.values(), required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: REACTION_TYPES.values(), required: true },
    version: { type: Number, default: 0 },
  },
  "reactions",
  [[{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }], [{ targetType: 1, targetId: 1 }]],
);
