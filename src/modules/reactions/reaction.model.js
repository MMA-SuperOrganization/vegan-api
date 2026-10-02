import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["recipe", "post", "video", "comment"],
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
    type: {
      type: String,
      enum: ["like"],
      default: "like",
    },
  },
  {
    collection: "reactions",
    timestamps: true,
    versionKey: false,
  },
);

reactionSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const Reaction = mongoose.models.Reaction ?? mongoose.model("Reaction", reactionSchema);
