import mongoose from "mongoose";
import { registerModel, ref } from "../../common/persistence/content-model.js";
import { SAVED_TARGET_TYPES } from "./saved-items.constants.js";
export const SavedItemsModel = registerModel(
  "SavedItems",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: SAVED_TARGET_TYPES, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  "saveditems",
  [[{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }], [{ userId: 1, createdAt: -1 }]],
);
