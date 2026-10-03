import mongoose from "mongoose";
import { registerModel, ref } from "../recipes/content-model.js";
export const SavedItemsModel = registerModel(
  "SavedItems",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: ["recipe", "post", "video"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  "saveditems",
  [[{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }], [{ userId: 1, createdAt: -1 }]],
);
