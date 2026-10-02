import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    amountMl: Number,
    recordedAt: Date,
    note: String,
  },
  { timestamps: true, versionKey: false },
);

export const WaterLogsModel = mongoose.model("WaterLogs", schema);
