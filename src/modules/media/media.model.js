import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    ownerId: String,
    objectKey: { type: String, unique: true },
    bucket: String,
    publicUrl: String,
    kind: String,
    purpose: String,
    mimeType: String,
    sizeBytes: Number,
    etag: String,
    status: String,
    linkedEntityType: String,
    linkedEntityId: String,
    confirmedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const MediaModel = mongoose.model("Media", schema);
