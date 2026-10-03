import mongoose from "mongoose";
import { registerModel, ref, shortText } from "../recipes/content-model.js";
export const CommentsModel = registerModel(
  "Comments",
  {
    authorId: { ...ref("User", true), index: true },
    targetType: { type: String, enum: ["recipe", "post", "video"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    parentCommentId: { ...ref("Comments"), default: null },
    content: { ...shortText(5000), required: true },
    status: { type: String, enum: ["visible", "hidden", "deleted"], default: "visible" },
    parentHidden: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 0 },
    reactionCount: { type: Number, min: 0, default: 0 },
  },
  "comments",
  [[{ targetType: 1, targetId: 1, status: 1, createdAt: -1 }], [{ parentCommentId: 1, status: 1 }]],
);
