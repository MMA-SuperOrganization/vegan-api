import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    authorId: String,
    targetType: String,
    targetId: String,
    parentCommentId: String,
    content: String,
    status: { type: String, default: "visible" },
  },
  { timestamps: true, versionKey: false },
);

export const CommentsModel = mongoose.model("Comments", schema);
