import mongoose from "mongoose";
import { registerModel, ref } from "../../common/persistence/content-model.js";
import { VIEW_HISTORY_TARGET_TYPES } from "../../common/constants/enums/engagement.enums.js";

export const ViewHistoryModel = registerModel(
  "ViewHistory",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: VIEW_HISTORY_TARGET_TYPES.values(), required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lastViewedAt: Date,
    lastCountedAt: Date,
    viewCount: { type: Number, min: 0, default: 0 },
    progressSeconds: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    lastProgressAt: Date,
    version: { type: Number, default: 0 },
  },
  "viewhistories",
  [
    [{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }],
    [{ userId: 1, lastViewedAt: -1 }],
  ],
);
