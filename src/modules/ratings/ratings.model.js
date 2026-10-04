import mongoose from "mongoose";
import { registerModel, ref, shortText } from "../../common/persistence/content-model.js";
export const RatingsModel = registerModel(
  "Ratings",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: ["recipe", "video"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, min: 1, max: 5, required: true, validate: Number.isInteger },
    review: shortText(3000),
    version: { type: Number, default: 0 },
  },
  "ratings",
  [
    [{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }],
    [{ targetType: 1, targetId: 1, score: 1 }],
  ],
);
