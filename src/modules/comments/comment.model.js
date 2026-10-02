import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["recipe", "post", "video"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
      index: true,
    },
    metrics: {
      likes: { type: Number, default: 0 },
      repliesCount: { type: Number, default: 0 },
    },
  },
  {
    collection: "comments",
    timestamps: true,
    versionKey: false,
  },
);

// Compound index cho query gốc (không phải reply) của một target
commentSchema.index({ targetType: 1, targetId: 1, parentId: 1, status: 1 });

export const Comment = mongoose.models.Comment ?? mongoose.model("Comment", commentSchema);
