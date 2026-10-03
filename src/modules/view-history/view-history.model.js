import mongoose from "mongoose";
import { registerModel, ref } from "../recipes/content-model.js";
export const ViewHistoryModel = registerModel(
  "ViewHistory",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: ["recipe", "post", "video"], required: true },
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
