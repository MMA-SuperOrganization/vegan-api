import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    reportIds: [String],
    targetType: String,
    targetId: String,
    status: String,
    priority: String,
    assignedAdminId: String,
    actions: [{}],
  },
  { timestamps: true, versionKey: false },
);

export const ModerationModel = mongoose.model("Moderation", schema);
