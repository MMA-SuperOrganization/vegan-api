import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["recipe", "video"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    collection: "ratings",
    timestamps: true,
    versionKey: false,
  },
);

ratingSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const Rating = mongoose.models.Rating ?? mongoose.model("Rating", ratingSchema);
