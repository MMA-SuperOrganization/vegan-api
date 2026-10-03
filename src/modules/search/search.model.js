import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    query: { type: String, required: true, maxlength: 120 },
    normalizedQuery: { type: String, required: true, maxlength: 120 },
    type: { type: String, enum: ["all", "recipe", "post", "video", "food-item"], default: "all" },
    searchedAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false, collection: "searchhistories" },
);
schema.index({ userId: 1, normalizedQuery: 1, type: 1 }, { unique: true });
schema.index({ userId: 1, searchedAt: -1, _id: -1 });
export const SearchHistoryModel =
  mongoose.models.SearchHistory ?? mongoose.model("SearchHistory", schema);
