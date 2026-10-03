import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    targetType: {
      type: String,
      enum: ["recipe", "post", "video", "comment", "user"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["spam", "harmful", "misinformation", "harassment", "copyright", "other"],
      required: true,
    },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      required: true,
    },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },
    moderationCaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Moderation", default: null },
    resolution: { type: String, maxlength: 2000 },
    resolvedAt: Date,
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "reports" },
);
schema.index({ reporterId: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ targetType: 1, targetId: 1 });
schema.index(
  { reporterId: 1, targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["open", "reviewing"] } } },
);
export const ReportsModel = mongoose.models.Reports ?? mongoose.model("Reports", schema);
