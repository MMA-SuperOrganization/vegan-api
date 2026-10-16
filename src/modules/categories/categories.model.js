import mongoose from "mongoose";
import {
  CATEGORY_TYPES,
  MASTER_DATA_STATUSES,
} from "../../common/constants/enums/master-data.enums.js";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, required: true, enum: CATEGORY_TYPES.values() },
    status: {
      type: String,
      enum: MASTER_DATA_STATUSES.values(),
      default: MASTER_DATA_STATUSES.ACTIVE,
    },
    sortOrder: { type: Number, default: 0 },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
      default: null,
      index: true,
    },
  },
  { timestamps: true, versionKey: false, collection: "categories" },
);
schema.index({ status: 1, type: 1, sortOrder: 1 });
export const CategoriesModel = mongoose.models.Categories || mongoose.model("Categories", schema);
