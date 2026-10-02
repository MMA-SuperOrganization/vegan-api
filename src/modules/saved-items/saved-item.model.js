import mongoose from "mongoose";

const savedItemSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["recipe", "post", "video"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    collection: "savedItems",
    timestamps: true,
    versionKey: false,
  },
);

savedItemSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const SavedItem = mongoose.models.SavedItem ?? mongoose.model("SavedItem", savedItemSchema);
