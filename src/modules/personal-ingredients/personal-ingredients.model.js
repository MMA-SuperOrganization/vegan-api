import mongoose from "mongoose";
import { UNITS } from "../../common/utils/units.js";

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    normalizedName: { type: String, required: true, maxlength: 150 },
    defaultUnit: { type: String, enum: UNITS, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, versionKey: false, collection: "personalingredients" },
);

schema.index({ userId: 1, normalizedName: 1 }, { unique: true });
schema.index({ userId: 1, status: 1, normalizedName: 1 });

export const PersonalIngredientsModel =
  mongoose.models.PersonalIngredients ?? mongoose.model("PersonalIngredients", schema);
