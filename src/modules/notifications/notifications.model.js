import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    type: String,
    title: String,
    body: String,
    data: {},
    channel: String,
    status: String,
    readAt: Date,
    sentAt: Date,
    failureReason: String,
  },
  { timestamps: true, versionKey: false },
);

export const NotificationsModel = mongoose.model("Notifications", schema);
