import mongoose from "mongoose";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  DISPATCH_STATUSES,
} from "../../common/constants/enums/notification.enums.js";

const { Schema } = mongoose;
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    type: { type: String, required: true, maxlength: 80 },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 4000 },
    data: Schema.Types.Mixed,
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS.values(),
      default: NOTIFICATION_CHANNELS.IN_APP,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUSES.values(),
      default: NOTIFICATION_STATUSES.PENDING,
    },
    readAt: { type: Date, default: null },
    sentAt: Date,
    failureReason: String,
    deletedAt: { type: Date, default: null },
    deliveryKey: String,
    pushStatus: {
      type: String,
      enum: DISPATCH_STATUSES.values(),
      default: DISPATCH_STATUSES.PENDING,
    },
    pushLockedBy: String,
    pushLockExpiresAt: Date,
  },
  { collection: "notifications", timestamps: true, versionKey: false },
);
schema.index({ userId: 1, createdAt: -1 });
schema.index({ userId: 1, readAt: 1, deletedAt: 1 });
schema.index(
  { deliveryKey: 1 },
  { unique: true, partialFilterExpression: { deliveryKey: { $type: "string" } } },
);
const preferenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    pushEnabled: { type: Boolean, default: true },
    mealReminderEnabled: { type: Boolean, default: true },
    waterReminderEnabled: { type: Boolean, default: true },
    contentEnabled: { type: Boolean, default: true },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: "22:00" },
      end: { type: String, default: "07:00" },
    },
    timezone: { type: String, default: "UTC" },
  },
  { collection: "notificationPreferences", timestamps: true, versionKey: false },
);
preferenceSchema.index({ userId: 1 }, { unique: true });
export const NotificationsModel =
  mongoose.models.Notifications || mongoose.model("Notifications", schema);
export const NotificationPreferencesModel =
  mongoose.models.NotificationPreferences ||
  mongoose.model("NotificationPreferences", preferenceSchema);
export const notificationModels = {
  notifications: NotificationsModel,
  notificationPreferences: NotificationPreferencesModel,
};
