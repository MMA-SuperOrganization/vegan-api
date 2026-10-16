import mongoose from "mongoose";
import { registerModel, ref, shortText } from "../../common/persistence/content-model.js";
import {
  MEDIA_ENTITY_TYPES,
  MEDIA_KINDS,
  MEDIA_PURPOSES,
  MEDIA_MIME_TYPES,
  MEDIA_STATUSES,
} from "../../common/constants/enums/media.enums.js";

const reference = new mongoose.Schema(
  {
    entityType: { type: String, enum: MEDIA_ENTITY_TYPES.values(), required: true },
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
    kind: { type: String, enum: MEDIA_KINDS.values(), required: true },
    purpose: {
      type: String,
      enum: MEDIA_PURPOSES.values(),
      required: true,
    },
    mimeType: {
      type: String,
      enum: MEDIA_MIME_TYPES.values(),
      required: true,
    },
    sizeBytes: { type: Number, min: 1, required: true },
    etag: shortText(200),
    status: {
      type: String,
      enum: MEDIA_STATUSES.values(),
      default: MEDIA_STATUSES.PENDING,
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
