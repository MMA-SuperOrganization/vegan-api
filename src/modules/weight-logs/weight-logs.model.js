import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    weightKg: Number,
    recordedAt: Date,
    note: String,
  },
  { timestamps: true, versionKey: false },
);

export const WeightLogsModel = mongoose.model("WeightLogs", schema);
