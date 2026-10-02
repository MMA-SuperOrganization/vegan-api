import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    type: { type: String, enum: ["food", "recipe", "post"] },
    status: String,
    sortOrder: Number,
  },
  { timestamps: true, versionKey: false },
);

export const CategoriesModel = mongoose.model("Categories", schema);
