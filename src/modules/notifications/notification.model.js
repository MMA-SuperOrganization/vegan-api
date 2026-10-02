import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    title: String,
    body: String,
    data: Object,
    channel: { type: String, enum: ["in_app", "push"] },
    status: { type: String, enum: ["pending", "sent", "failed", "read"], default: "pending" },
    readAt: Date,
    sentAt: Date,
    failureReason: String,
  },
  { timestamps: true, versionKey: false },
);
notificationSchema.index({ userId: 1, createdAt: -1 });
export const Notification =
  mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);
