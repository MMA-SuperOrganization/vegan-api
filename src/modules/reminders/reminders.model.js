import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    type: String,
    title: String,
    body: String,
    schedule: {},
    nextRunAt: Date,
    lastRunAt: Date,
    status: String,
    lockedAt: Date,
    lockedBy: String,
    lockExpiresAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const RemindersModel = mongoose.model("Reminders", schema);
