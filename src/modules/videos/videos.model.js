import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    authorId: String,
    title: String,
    slug: { type: String, unique: true },
    description: String,
    thumbnailMediaId: String,
    videoMediaId: String,
    categoryIds: [String],
    tags: [String],
    durationSeconds: Number,
    difficulty: String,
    recipeId: String,
    transcript: String,
    summary: String,
    chapters: [{}],
    status: { type: String, default: "draft" },
    visibility: String,
    viewCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    publishedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const VideosModel = mongoose.model("Videos", schema);
