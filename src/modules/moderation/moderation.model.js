import mongoose from "mongoose";
const actionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["hide", "restore"], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    reason: { type: String, maxlength: 2000 },
    beforeStatus: String,
    afterStatus: String,
    at: { type: Date, required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    reportIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reports" }],
      default: [],
      validate: {
        validator: (values) => values.length <= 50,
        message: "A moderation case can contain at most 50 reports",
      },
    },
    targetType: {
      type: String,
      enum: ["recipe", "post", "video", "comment", "user"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      required: true,
    },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },
    resolution: { type: String, maxlength: 2000 },
    resolvedAt: Date,
    actions: { type: [actionSchema], default: [] },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "moderations" },
);
schema.index({ status: 1, priority: 1, createdAt: -1 });
schema.index(
  { targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["open", "reviewing"] } } },
);
export const ModerationModel = mongoose.models.Moderation ?? mongoose.model("Moderation", schema);
