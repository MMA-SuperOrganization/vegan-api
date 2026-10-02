import mongoose from "mongoose";
const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["meal", "water", "custom"] },
    title: String,
    body: String,
    schedule: {
      mode: { type: String, enum: ["once", "daily", "weekly"] },
      at: String,
      daysOfWeek: [Number],
      timezone: String,
    },
    nextRunAt: Date,
    lastRunAt: Date,
    status: {
      type: String,
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false },
);
export const Reminder = mongoose.models.Reminder ?? mongoose.model("Reminder", reminderSchema);
