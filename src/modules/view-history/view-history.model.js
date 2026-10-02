import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    targetType: String,
    targetId: String,
    lastViewedAt: Date,
    viewCount: { type: Number, default: 0 },
    progressSeconds: Number,
    completed: Boolean,
    lastProgressAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const ViewHistoryModel = mongoose.model("ViewHistory", schema);
