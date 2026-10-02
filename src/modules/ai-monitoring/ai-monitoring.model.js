import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    dummy: String,
  },
  { timestamps: true, versionKey: false },
);

export const AiMonitoringModel = mongoose.model("AiMonitoring", schema);
