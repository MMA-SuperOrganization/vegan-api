import mongoose from "mongoose";
import {
  MEASUREMENT_UNITS,
  MASTER_DATA_STATUSES,
} from "../../common/constants/enums/master-data.enums.js";
import {
  catalogSourceSchema,
  nutritionDataQualityField,
} from "../../common/persistence/catalog-source.js";

const { Schema } = mongoose;
const nutritionSchema = new Schema(
  Object.fromEntries(
    [
      "caloriesKcal",
      "proteinG",
      "carbsG",
      "fatG",
      "fiberG",
      "sugarG",
      "sodiumMg",
      "calciumMg",
      "ironMg",
      "vitaminB12Mcg",
      "vitaminDMcg",
    ].map((key) => [key, { type: Number, min: 0, max: 1000000, default: 0 }]),
  ),
  { _id: false },
);
const servingSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.000001 },
    unit: {
      type: String,
      required: true,
      enum: MEASUREMENT_UNITS.values(),
    },
    gramEquivalent: { type: Number, required: true, min: 0.000001 },
  },
  { _id: false },
);
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    normalizedName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    aliases: [String],
    categoryId: { type: Schema.Types.ObjectId, ref: "Categories", required: true, index: true },
    imageUrl: String,
    description: { type: String, trim: true, maxlength: 2000 },
    seasons: {
      type: [Number],
      default: [],
      validate: (months) =>
        months.length <= 12 &&
        months.every((month) => Number.isInteger(month) && month >= 1 && month <= 12),
    },
    defaultServing: { type: servingSchema, required: true },
    nutritionPer100g: { type: nutritionSchema, required: true },
    nutritionDataQuality: nutritionDataQualityField,
    sourceAttribution: { type: catalogSourceSchema },
    allergenIds: [{ type: Schema.Types.ObjectId, ref: "Allergens", index: true }],
    isVegan: { type: Boolean, required: true },
    isVegetarian: { type: Boolean, required: true },
    containsEggs: Boolean,
    containsDairy: Boolean,
    status: {
      type: String,
      enum: MASTER_DATA_STATUSES.values(),
      default: MASTER_DATA_STATUSES.ACTIVE,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Users" },
  },
  { timestamps: true, versionKey: false, collection: "fooditems" },
);
schema.index({ status: 1, normalizedName: 1 });
schema.index({ status: 1, isVegan: 1, categoryId: 1 });
schema.index(
  { "sourceAttribution.provider": 1, "sourceAttribution.sourceId": 1 },
  { sparse: true },
);
export const FoodItemsModel = mongoose.models.FoodItems || mongoose.model("FoodItems", schema);
