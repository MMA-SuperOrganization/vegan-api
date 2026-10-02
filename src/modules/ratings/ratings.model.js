import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    targetType: String,
    targetId: String,
    score: Number,
    review: String,
  },
  { timestamps: true, versionKey: false },
);

export const RatingsModel = mongoose.model("Ratings", schema);
