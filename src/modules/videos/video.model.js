import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1024,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
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
    collection: "videos",
    timestamps: true,
    versionKey: false,
  },
);

export const Video = mongoose.models.Video ?? mongoose.model("Video", videoSchema);
