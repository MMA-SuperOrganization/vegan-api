import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 2000 },
    severityNote: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, versionKey: false, collection: "allergens" },
);
schema.index({ status: 1, name: 1 });
export const AllergensModel = mongoose.models.Allergens || mongoose.model("Allergens", schema);
