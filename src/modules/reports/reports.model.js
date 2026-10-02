import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    reporterId: String,
    targetType: String,
    targetId: String,
    reason: String,
    description: String,
    status: String,
    assignedAdminId: String,
    resolution: String,
    resolvedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const ReportsModel = mongoose.model("Reports", schema);
