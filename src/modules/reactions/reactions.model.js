import mongoose from "mongoose";
import { registerModel, ref } from "../recipes/content-model.js";
export const ReactionsModel = registerModel(
  "Reactions",
  {
    userId: ref("User", true),
    targetType: { type: String, enum: ["recipe", "post", "video", "comment"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["like", "love", "helpful"], required: true },
    version: { type: Number, default: 0 },
  },
  "reactions",
  [[{ userId: 1, targetType: 1, targetId: 1 }, { unique: true }], [{ targetType: 1, targetId: 1 }]],
);
