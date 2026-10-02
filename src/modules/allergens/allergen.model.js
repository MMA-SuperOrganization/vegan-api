import mongoose from "mongoose";

const allergenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    severityNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
  },
  {
    collection: "allergens",
    timestamps: true,
    versionKey: false,
  },
);

export const Allergen = mongoose.models.Allergen ?? mongoose.model("Allergen", allergenSchema);
