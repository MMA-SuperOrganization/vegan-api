import mongoose from "mongoose";
import { registerModel, ref, shortText } from "../../common/persistence/content-model.js";
const reference = new mongoose.Schema(
  {
    entityType: { type: String, enum: ["recipe", "post", "video", "user"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);
export const MediaModel = registerModel(
  "Media",
  {
    ownerId: { ...ref("Users", true), index: true },
    objectKey: { ...shortText(1024), required: true, unique: true },
    bucket: shortText(),
    kind: { type: String, enum: ["image", "video"], required: true },
    purpose: {
      type: String,
      enum: [
        "avatar",
        "recipe",
        "recipe_step",
        "post",
        "video",
        "video_thumbnail",
        "ai_ingredient",
        "other",
      ],
      required: true,
    },
    mimeType: {
      type: String,
      enum: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"],
      required: true,
    },
    sizeBytes: { type: Number, min: 1, required: true },
    etag: shortText(200),
    status: {
      type: String,
      enum: ["pending", "ready", "rejected", "deleting", "deleted"],
      default: "pending",
    },
    references: [reference],
    linkedEntityType: shortText(30),
    linkedEntityId: mongoose.Schema.Types.ObjectId,
    confirmedAt: Date,
    deletedAt: { type: Date, default: null },
    deletionError: Boolean,
    version: { type: Number, default: 0, min: 0 },
    uploadExpiresAt: Date,
  },
  "media",
  [
    [{ ownerId: 1, status: 1, createdAt: -1 }],
    [{ status: 1, createdAt: 1 }],
    [{ "references.entityType": 1, "references.entityId": 1 }],
  ],
);
