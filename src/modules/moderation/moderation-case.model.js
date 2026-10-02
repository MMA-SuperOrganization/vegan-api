import mongoose from "mongoose";

const moderationCaseSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["recipe", "post", "video", "comment", "user"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    actionTaken: {
      type: String,
      enum: ["none", "hidden", "deleted", "user_suspended", "user_banned"],
      required: true,
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    collection: "moderationCases",
    timestamps: true,
    versionKey: false,
  },
);

moderationCaseSchema.index({ targetType: 1, targetId: 1 });

export const ModerationCase =
  mongoose.models.ModerationCase ?? mongoose.model("ModerationCase", moderationCaseSchema);
