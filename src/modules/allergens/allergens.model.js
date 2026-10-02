import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    severityNote: String,
    status: String,
  },
  { timestamps: true, versionKey: false },
);

export const AllergensModel = mongoose.model("Allergens", schema);
