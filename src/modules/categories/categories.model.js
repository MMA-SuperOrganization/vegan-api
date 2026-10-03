import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, required: true, enum: ["food", "recipe", "post"] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "categories" },
);
schema.index({ status: 1, type: 1, sortOrder: 1 });
export const CategoriesModel = mongoose.models.Categories || mongoose.model("Categories", schema);
