import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["food", "recipe", "post"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "categories",
    timestamps: true,
    versionKey: false,
  },
);

export const Category = mongoose.models.Category ?? mongoose.model("Category", categorySchema);
