import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    targetType: String,
    targetId: String,
    type: String,
  },
  { timestamps: true, versionKey: false },
);

export const ReactionsModel = mongoose.model("Reactions", schema);
