import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    type: { type: String, enum: ["meal", "water", "custom"], required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 4000 },
    schedule: {
      mode: { type: String, enum: ["once", "daily", "weekly"], required: true },
      at: { type: String, required: true },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      timezone: { type: String, default: "UTC" },
    },
    nextRunAt: Date,
    lastRunAt: Date,
    status: {
      type: String,
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
    },
    lockedAt: Date,
    lockedBy: String,
    lockExpiresAt: { type: Date, default: null },
    claimKey: String,
    version: { type: Number, default: 0 },
    failureCode: String,
  },
  { collection: "reminders", timestamps: true, versionKey: false },
);
schema.index({ status: 1, nextRunAt: 1, lockExpiresAt: 1 });
schema.index({ userId: 1, status: 1 });
export const RemindersModel = mongoose.models.Reminders || mongoose.model("Reminders", schema);
export const reminderModels = { reminders: RemindersModel };
