import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true, // Markdown
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "hidden"],
      default: "draft",
    },
    moderationNote: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
    },
    metrics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
    },
  },
  {
    collection: "posts",
    timestamps: true,
    versionKey: false,
  },
);

export const Post = mongoose.models.Post ?? mongoose.model("Post", postSchema);
