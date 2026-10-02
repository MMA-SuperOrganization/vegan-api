import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    authorId: String,
    title: String,
    content: String,
    mediaIds: [String],
    tags: [String],
    categoryIds: [String],
    postType: String,
    status: { type: String, default: "draft" },
    visibility: String,
    commentCount: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    publishedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const PostsModel = mongoose.model("Posts", schema);
