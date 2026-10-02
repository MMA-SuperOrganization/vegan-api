import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    targetType: String,
    targetId: String,
  },
  { timestamps: true, versionKey: false },
);

export const SavedItemsModel = mongoose.model("SavedItems", schema);
